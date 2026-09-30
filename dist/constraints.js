/**
 * Constraint parsing and checking, compatible with Masterminds/semver v3.4.0.
 *
 * Source behavior: https://github.com/Masterminds/semver
 * Commit: bf01c618459762fa583c24476ec46957a330c737
 */
import { Version, comparePrerelease } from "./version.js";
export class Constraints {
    groups;
    originalString;
    constructor(groups, original) {
        this.groups = groups;
        this.originalString = original;
    }
    /**
     * Parse a constraint string. Supports all Masterminds/semver syntax:
     * operators (=, !=, >, <, >=, <=), tilde (~), caret (^), wildcards (*, x, X),
     * hyphen ranges (1.0 - 2.0), AND (comma or space), OR (||).
     */
    static parse(constraint) {
        const original = constraint;
        let c = constraint.trim();
        // Empty constraint matches everything (like *)
        if (c === "")
            c = "*";
        // Rewrite hyphen ranges before splitting
        c = rewriteHyphenRanges(c);
        // Split on || for OR groups
        const orParts = c.split("||").map((s) => s.trim());
        const groups = [];
        for (const orPart of orParts) {
            if (orPart === "")
                continue;
            const andConstraints = parseAndGroup(orPart);
            if (andConstraints.length > 0) {
                groups.push(andConstraints);
            }
        }
        if (groups.length === 0) {
            throw new Error(`Invalid constraint: ${constraint}`);
        }
        return new Constraints(groups, original);
    }
    /**
     * Try to parse a constraint string. Returns null instead of throwing on invalid input.
     */
    static tryParse(constraint) {
        try {
            return Constraints.parse(constraint);
        }
        catch {
            return null;
        }
    }
    /**
     * Check if a version satisfies this constraint.
     */
    check(version, options) {
        const includePrerelease = options?.includePrerelease ?? false;
        // OR: any group must fully match
        for (const group of this.groups) {
            if (this.checkGroup(group, version, includePrerelease)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Validate a version against this constraint, returning errors.
     */
    validate(version, options) {
        const includePrerelease = options?.includePrerelease ?? false;
        const errors = [];
        for (const group of this.groups) {
            if (this.checkGroup(group, version, includePrerelease)) {
                return { satisfied: true, errors: [] };
            }
        }
        // Collect errors from all groups
        for (const group of this.groups) {
            for (const c of group) {
                if (!evalConstraint(c, version, includePrerelease)) {
                    errors.push(`${version.toString()} does not satisfy ${c.original}`);
                }
            }
        }
        return { satisfied: false, errors };
    }
    /**
     * The lowest version that satisfies this constraint, or null when no version
     * does. A pre-release is only returned when the constraint names one, as
     * `check` only admits pre-releases then. The result carries no metadata, and
     * `toOriginalString()` equals `toString()`.
     */
    minVersion() {
        let lowest = null;
        for (const group of this.groups) {
            const candidate = this.lowestOfGroup(group);
            if (candidate && (!lowest || candidate.lt(lowest))) {
                lowest = candidate;
            }
        }
        return lowest;
    }
    /**
     * The highest of the given versions that satisfies this constraint, or null
     * when none does, as Flux selects the version for a semver range. Of
     * versions with equal precedence (`1.2.3+a`, `1.2.3+b`) the first given is
     * returned; Flux does not define which one it picks.
     */
    maxSatisfying(versions, options) {
        let highest = null;
        for (const version of versions) {
            if ((!highest || version.gt(highest)) && this.check(version, options)) {
                highest = version;
            }
        }
        return highest;
    }
    toString() {
        return this.originalString;
    }
    /**
     * Starts at the lowest version at all and moves up past every constraint
     * that rejects the candidate. Each step only skips versions the rejecting
     * constraint rules out, so the first accepted candidate is the lowest; an
     * upper bound rejecting it means no version satisfies the group.
     */
    lowestOfGroup(group) {
        // `checkGroup` admits pre-releases for the whole group when any of its
        // constraints names one.
        const prerelease = group.some((c) => c.prerelease !== "");
        let floor = makeVersion(0, 0, 0, prerelease ? "0" : "");
        // Each constraint rejects the rising candidate at most once before it is
        // either passed or found to be an upper bound.
        for (let step = 0; step <= group.length; step++) {
            if (this.checkGroup(group, floor, false)) {
                return floor;
            }
            let next = null;
            for (const c of group) {
                if (evalConstraint(c, floor, prerelease))
                    continue;
                const past = stepPast(c, floor, prerelease);
                if (!past)
                    return null;
                if (!next || past.gt(next))
                    next = past;
            }
            if (!next || !next.gt(floor))
                return null;
            floor = next;
        }
        return null;
    }
    checkGroup(group, version, includePrerelease) {
        // Prerelease gate at group level: if ANY constraint in the group has a
        // prerelease, then prerelease versions are allowed for the whole group.
        let groupIncludePrerelease = includePrerelease;
        if (!groupIncludePrerelease && version.prerelease !== "") {
            groupIncludePrerelease = group.some((c) => c.prerelease !== "");
        }
        for (const c of group) {
            if (!evalConstraint(c, version, groupIncludePrerelease)) {
                return false;
            }
        }
        return true;
    }
}
// =============================================================================
// Lower bounds
// =============================================================================
function makeVersion(major, minor, patch, prerelease) {
    const text = `${major}.${minor}.${patch}${prerelease ? `-${prerelease}` : ""}`;
    return new Version(major, minor, patch, prerelease, "", text);
}
/**
 * The lowest release, or with `prerelease` the lowest pre-release, of the given
 * version: `1.2.3`, or `1.2.3-0` below every other pre-release of it.
 */
function lowestOf(major, minor, patch, prerelease) {
    return makeVersion(major, minor, patch, prerelease ? "0" : "");
}
/** The version directly above `v`: the next patch, or with `prerelease` the next pre-release. */
function nextAbove(v, prerelease) {
    if (prerelease && v.prerelease !== "") {
        return makeVersion(v.major, v.minor, v.patch, `${v.prerelease}.0`);
    }
    return lowestOf(v.major, v.minor, v.patch + 1, prerelease);
}
/**
 * The lowest version above `floor` that constraint `c`, which rejects `floor`,
 * could still admit, or null when `c` admits nothing at or above `floor`.
 */
function stepPast(c, floor, prerelease) {
    const { major, minor } = c.version;
    switch (c.op) {
        case "<":
        case "<=":
            // An upper bound: nothing higher is admitted either.
            return null;
        case "!=": {
            // Try the next version first: Masterminds admits some pre-releases
            // inside a wildcard exclusion (`!=1.2.x` admits `1.2.5-0`).
            const next = nextAbove(floor, prerelease);
            if (evalConstraint(c, next, prerelease))
                return next;
            if (c.minorDirty)
                return lowestOf(major + 1, 0, 0, prerelease);
            if (c.patchDirty)
                return lowestOf(major, minor + 1, 0, prerelease);
            return nextAbove(c.version, prerelease);
        }
        case ">": {
            const { patch } = c.version;
            let bound;
            if (c.minorDirty)
                bound = lowestOf(major + 1, 0, 0, prerelease);
            else if (c.patchDirty)
                bound = lowestOf(major, minor + 1, 0, prerelease);
            else if (c.prerelease !== "") {
                // The lowest pre-release above `1.2.3-rc.1` is `1.2.3-rc.1.0`.
                bound = makeVersion(major, minor, patch, `${c.prerelease}.0`);
            }
            else
                bound = lowestOf(major, minor, patch + 1, prerelease);
            return bound.gt(floor) ? bound : null;
        }
        default: {
            // `=`, `>=`, `~` and `^` admit one contiguous range starting at their
            // version: below it, move up to it; above it, nothing higher is admitted.
            const bound = makeVersion(major, minor, c.version.patch, c.prerelease);
            return bound.gt(floor) ? bound : null;
        }
    }
}
// =============================================================================
// Hyphen range rewriting
// =============================================================================
/**
 * Rewrite hyphen ranges: "1.0 - 2.0" → ">= 1.0, <= 2.0"
 * Must only match when there are spaces around the hyphen.
 * "1.2-5" (no spaces) is a version with prerelease, NOT a range.
 * Either end is a constraint version as in Go's constraintRangeRegex:
 * wildcard parts, a prerelease and metadata are allowed ("1.0 - *").
 */
const RANGE_VERSION = String.raw `[\dxX*]+(?:\.[\dxX*]+)?(?:\.[\dxX*]+)?(?:-[\w.-]+)?(?:\+[\w.-]+)?`;
const RANGE_RE = new RegExp(`(${RANGE_VERSION})\\s+-\\s+(${RANGE_VERSION})`, "g");
function rewriteHyphenRanges(s) {
    return s.replace(RANGE_RE, (_, low, high) => `>= ${low}, <= ${high}`);
}
// =============================================================================
// AND group parsing
// =============================================================================
// Matches a single constraint: optional operator + version (with optional prerelease/metadata)
// or bare wildcard (*, x, X) optionally followed by prerelease (-0, -alpha, etc)
const CONSTRAINT_RE = /(?:([!=><~^]+)\s*)?(?:([\d]+(?:\.(?:[\dxX*]+))?(?:\.(?:[\dxX*]+))?(?:-[\w.+-]+)?(?:\+[\w.+-]+)?)|([xX*])(?:-([\w.+-]+))?)/g;
function parseAndGroup(groupStr) {
    // Split on commas first, then parse each part for space-separated constraints
    const commaParts = groupStr.split(",").map((s) => s.trim());
    const results = [];
    for (const part of commaParts) {
        if (part === "")
            continue;
        // Find all constraints in this part (space-separated constraints)
        const matches = [...part.matchAll(CONSTRAINT_RE)];
        for (const m of matches) {
            const opStr = m[1] ?? "";
            let versionStr = m[2] ?? m[3] ?? "*";
            // If bare wildcard with prerelease suffix (e.g., "*-0")
            if (m[3] && m[4]) {
                versionStr = `${m[3]}-${m[4]}`;
            }
            const parsed = parseSingleConstraint(opStr, versionStr, m[0]);
            results.push(parsed);
        }
    }
    return results;
}
// =============================================================================
// Single constraint parsing
// =============================================================================
function parseSingleConstraint(opStr, versionStr, original) {
    const op = normalizeOperator(opStr);
    // Detect dirty flags: which parts are wildcards or missing?
    let majorDirty = false;
    let minorDirty = false;
    let patchDirty = false;
    // Strip metadata for constraint parsing
    let verNorm = versionStr;
    const plusIdx = verNorm.indexOf("+");
    if (plusIdx !== -1) {
        verNorm = verNorm.substring(0, plusIdx);
    }
    // Split prerelease from version
    let prerelease = "";
    const dashIdx = findPrereleaseDash(verNorm);
    if (dashIdx !== -1) {
        prerelease = verNorm.substring(dashIdx + 1);
        verNorm = verNorm.substring(0, dashIdx);
    }
    // Parse major.minor.patch with wildcard detection
    const parts = verNorm.split(".");
    let major = 0;
    let minor = 0;
    let patch = 0;
    if (isWildcard(parts[0])) {
        majorDirty = true;
    }
    else {
        major = parseInt(parts[0], 10);
        if (parts.length < 2 || isWildcard(parts[1])) {
            minorDirty = true;
            patchDirty = true;
        }
        else {
            minor = parseInt(parts[1], 10);
            if (parts.length < 3 || isWildcard(parts[2])) {
                patchDirty = true;
            }
            else {
                patch = parseInt(parts[2], 10);
            }
        }
    }
    const version = new Version(major, minor, patch, prerelease, "", versionStr);
    return {
        op,
        version,
        majorDirty,
        minorDirty,
        patchDirty,
        prerelease,
        original: original.trim(),
    };
}
function findPrereleaseDash(s) {
    // Find the first dash that separates prerelease from version.
    // Must come after a digit or wildcard character and not be inside a version number.
    // E.g., "1.2.3-beta" → dash at index 5. "1.2-beta" → dash at index 3. "*-0" → dash at index 1.
    for (let i = 0; i < s.length; i++) {
        if (s[i] === "-" && i > 0) {
            const before = s[i - 1];
            if ((before >= "0" && before <= "9") ||
                before === "*" ||
                before === "x" ||
                before === "X") {
                return i;
            }
        }
    }
    return -1;
}
function isWildcard(s) {
    return s === "*" || s === "x" || s === "X";
}
function normalizeOperator(op) {
    switch (op.trim()) {
        case "":
        case "=":
            return "=";
        case "!=":
            return "!=";
        case ">":
            return ">";
        case "<":
            return "<";
        case ">=":
        case "=>":
            return ">=";
        case "<=":
        case "=<":
            return "<=";
        case "~":
        case "~>":
            return "~";
        case "^":
            return "^";
        default:
            throw new Error(`Unknown operator: ${op}`);
    }
}
// =============================================================================
// Constraint evaluation
// =============================================================================
function evalConstraint(c, v, includePrerelease) {
    switch (c.op) {
        case "=":
            return evalEqual(c, v, includePrerelease);
        case "!=":
            return evalNotEqual(c, v, includePrerelease);
        case ">":
            return evalGreaterThan(c, v, includePrerelease);
        case "<":
            return evalLessThan(c, v, includePrerelease);
        case ">=":
            return evalGreaterThanOrEqual(c, v, includePrerelease);
        case "<=":
            return evalLessThanOrEqual(c, v, includePrerelease);
        case "~":
            return evalTilde(c, v, includePrerelease);
        case "^":
            return evalCaret(c, v, includePrerelease);
    }
}
/**
 * Prerelease gate: if the version has a prerelease and the constraint doesn't,
 * and includePrerelease is false, reject the version.
 * Returns true if the version should be rejected (skipped).
 */
function prereleaseGate(c, v, includePrerelease) {
    if (v.prerelease === "")
        return false; // release version, no gate
    if (includePrerelease)
        return false; // flag overrides
    if (c.prerelease !== "")
        return false; // constraint has prerelease, allow
    return true; // reject: version has prerelease but constraint doesn't
}
// --- Equality ---
/**
 * Go's constraintTildeOrEqual: when dirty, delegates to tilde. Otherwise exact equality.
 */
function evalEqual(c, v, includePrerelease) {
    if (prereleaseGate(c, v, includePrerelease))
        return false;
    const dirty = c.majorDirty || c.minorDirty || c.patchDirty;
    if (dirty) {
        // Delegate to tilde logic when any part is a wildcard
        return evalTilde(c, v, includePrerelease);
    }
    // Exact equality
    return v.eq(c.version);
}
/**
 * Go's constraintNotEqual: custom dirty-flag logic with prerelease handling.
 */
function evalNotEqual(c, v, includePrerelease) {
    if (prereleaseGate(c, v, includePrerelease))
        return false;
    const dirty = c.majorDirty || c.minorDirty || c.patchDirty;
    if (dirty) {
        // Check component by component
        if (c.version.major !== v.major)
            return true;
        if (c.version.minor !== v.minor && !c.minorDirty)
            return true;
        if (c.minorDirty)
            return false; // same major, minor is wildcard → equal
        if (c.version.patch !== v.patch && !c.patchDirty)
            return true;
        if (c.patchDirty) {
            // Same major.minor, patch is wildcard: check prerelease
            if (v.prerelease !== "" || c.prerelease !== "") {
                return comparePrerelease(v.prerelease, c.prerelease) !== 0;
            }
            return false; // both have no prerelease, same major.minor → equal
        }
    }
    return !v.eq(c.version);
}
// --- Comparison operators ---
function evalGreaterThan(c, v, includePrerelease) {
    if (prereleaseGate(c, v, includePrerelease))
        return false;
    const dirty = c.majorDirty || c.minorDirty || c.patchDirty;
    if (!dirty) {
        return v.compare(c.version) === 1;
    }
    if (v.major > c.version.major)
        return true;
    if (v.major < c.version.major)
        return false;
    if (c.minorDirty)
        return false; // >1.x: nothing in major 1 is > 1.x
    if (c.patchDirty) {
        return v.minor > c.version.minor;
    }
    return v.compare(c.version) === 1;
}
function evalLessThan(c, v, includePrerelease) {
    if (prereleaseGate(c, v, includePrerelease))
        return false;
    // Go's constraintLessThan does NOT use dirty flags — direct comparison.
    return v.compare(c.version) === -1;
}
function evalGreaterThanOrEqual(c, v, includePrerelease) {
    if (prereleaseGate(c, v, includePrerelease))
        return false;
    // Go's constraintGreaterThanEqual: no dirty flag handling, direct compare.
    return v.compare(c.version) >= 0;
}
function evalLessThanOrEqual(c, v, includePrerelease) {
    if (prereleaseGate(c, v, includePrerelease))
        return false;
    const dirty = c.majorDirty || c.minorDirty || c.patchDirty;
    if (!dirty) {
        return v.compare(c.version) <= 0;
    }
    // Dirty: check component by component
    if (v.major > c.version.major)
        return false;
    if (v.major === c.version.major &&
        !c.minorDirty &&
        v.minor > c.version.minor) {
        return false;
    }
    return true;
}
// --- Tilde ---
/**
 * Tilde range: allows patch-level changes if minor is specified,
 * minor-level changes if only major is specified.
 *
 * ~1.2.3  := >=1.2.3, <1.3.0
 * ~1.2    := >=1.2.0, <1.3.0
 * ~1      := >=1.0.0, <2.0.0
 * ~0.2.3  := >=0.2.3, <0.3.0
 */
function evalTilde(c, v, includePrerelease) {
    if (prereleaseGate(c, v, includePrerelease))
        return false;
    // v must be >= constraint version
    if (v.compare(c.version) === -1)
        return false;
    if (c.majorDirty) {
        // ~* matches everything
        return true;
    }
    // Special case from Go: ~0.0.0 (all zero, all specified) matches everything >= 0.0.0
    if (c.version.major === 0 &&
        c.version.minor === 0 &&
        c.version.patch === 0 &&
        !c.minorDirty &&
        !c.patchDirty) {
        return true;
    }
    // Must be same major
    if (v.major !== c.version.major)
        return false;
    if (c.minorDirty) {
        // ~1.x or ~1: allows any minor/patch within major
        return true;
    }
    // Must be same minor
    if (v.minor !== c.version.minor)
        return false;
    // If patch is dirty, any patch is fine (already checked >= above)
    // If patch is specified, already checked >= above and same minor, so OK
    return true;
}
// --- Caret ---
/**
 * Caret range: allows changes that do not modify the leftmost non-zero digit.
 * Go's constraintCaret: a wildcard or missing part counts as 0 in the lower
 * bound, so `^1` rejects `1.0.0-rc.1` as `^1.0.0` does.
 *
 * ^1.2.3  := >=1.2.3, <2.0.0
 * ^0.2.3  := >=0.2.3, <0.3.0
 * ^0.0.3  := >=0.0.3, <0.0.4
 * ^1.2.x  := >=1.2.0, <2.0.0
 * ^0.0    := >=0.0.0, <0.1.0
 * ^0      := >=0.0.0, <1.0.0
 */
function evalCaret(c, v, includePrerelease) {
    if (prereleaseGate(c, v, includePrerelease))
        return false;
    // Every branch below relies on this lower bound, pre-releases included.
    if (v.compare(c.version) === -1)
        return false;
    // Major > 0, or ^0.x: the major must match.
    if (c.version.major > 0 || c.minorDirty)
        return v.major === c.version.major;
    if (v.major > 0)
        return false;
    // Minor > 0, or ^0.0.x: the minor must match.
    if (c.version.minor > 0 || c.patchDirty)
        return v.minor === c.version.minor;
    if (v.minor > 0)
        return false;
    // ^0.0.3: the patch must match.
    return v.patch === c.version.patch;
}
//# sourceMappingURL=constraints.js.map