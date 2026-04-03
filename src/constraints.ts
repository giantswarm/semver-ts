/**
 * Constraint parsing and checking, compatible with Masterminds/semver v3.4.0.
 *
 * Source behavior: https://github.com/Masterminds/semver
 * Commit: bf01c618459762fa583c24476ec46957a330c737
 */

import { Version, comparePrerelease } from "./version.js";

type Operator = "=" | "!=" | ">" | "<" | ">=" | "<=" | "~" | "^";

interface ParsedConstraint {
  op: Operator;
  version: Version;
  /** Was major explicitly specified (not a wildcard)? */
  majorDirty: boolean;
  /** Was minor explicitly specified? false if wildcard or absent. */
  minorDirty: boolean;
  /** Was patch explicitly specified? false if wildcard or absent. */
  patchDirty: boolean;
  /** Original prerelease from constraint (before coercion to Version). */
  prerelease: string;
  /** Original constraint string for this part. */
  original: string;
}

// OR groups of AND constraints.
type ConstraintGroups = ParsedConstraint[][];

export interface CheckOptions {
  /** When true, prerelease versions satisfy constraints even without a prerelease tag. */
  includePrerelease?: boolean;
}

export class Constraints {
  private groups: ConstraintGroups;
  private originalString: string;

  private constructor(groups: ConstraintGroups, original: string) {
    this.groups = groups;
    this.originalString = original;
  }

  /**
   * Parse a constraint string. Supports all Masterminds/semver syntax:
   * operators (=, !=, >, <, >=, <=), tilde (~), caret (^), wildcards (*, x, X),
   * hyphen ranges (1.0 - 2.0), AND (comma or space), OR (||).
   */
  static parse(constraint: string): Constraints {
    const original = constraint;
    let c = constraint.trim();

    // Empty constraint matches everything (like *)
    if (c === "") c = "*";

    // Rewrite hyphen ranges before splitting
    c = rewriteHyphenRanges(c);

    // Split on || for OR groups
    const orParts = c.split("||").map((s) => s.trim());
    const groups: ConstraintGroups = [];

    for (const orPart of orParts) {
      if (orPart === "") continue;
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
  static tryParse(constraint: string): Constraints | null {
    try {
      return Constraints.parse(constraint);
    } catch {
      return null;
    }
  }

  /**
   * Check if a version satisfies this constraint.
   */
  check(version: Version, options?: CheckOptions): boolean {
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
  validate(
    version: Version,
    options?: CheckOptions,
  ): { satisfied: boolean; errors: string[] } {
    const includePrerelease = options?.includePrerelease ?? false;
    const errors: string[] = [];
    for (const group of this.groups) {
      if (this.checkGroup(group, version, includePrerelease)) {
        return { satisfied: true, errors: [] };
      }
    }
    // Collect errors from all groups
    for (const group of this.groups) {
      for (const c of group) {
        if (!evalConstraint(c, version, includePrerelease)) {
          errors.push(
            `${version.toString()} does not satisfy ${c.original}`,
          );
        }
      }
    }
    return { satisfied: false, errors };
  }

  toString(): string {
    return this.originalString;
  }

  private checkGroup(
    group: ParsedConstraint[],
    version: Version,
    includePrerelease: boolean,
  ): boolean {
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
// Hyphen range rewriting
// =============================================================================

/**
 * Rewrite hyphen ranges: "1.0 - 2.0" → ">= 1.0, <= 2.0"
 * Must only match when there are spaces around the hyphen.
 * "1.2-5" (no spaces) is a version with prerelease, NOT a range.
 */
function rewriteHyphenRanges(s: string): string {
  // Match: version SPACE - SPACE version
  // Version-like: digits possibly with dots and prerelease
  const re = /([\d]+(?:\.[\d]+)?(?:\.[\d]+)?(?:-[\w.]+)?)\s+-\s+([\d]+(?:\.[\d]+)?(?:\.[\d]+)?(?:-[\w.]+)?)/g;
  return s.replace(re, (_, low, high) => `>= ${low}, <= ${high}`);
}

// =============================================================================
// AND group parsing
// =============================================================================

// Matches a single constraint: optional operator + version (with optional prerelease/metadata)
// Also matches bare wildcards (*, x, X) optionally followed by prerelease (-0, -alpha, etc)
const CONSTRAINT_RE =
  /(?:([!=><~^]+)\s*)?([\d]+(?:\.(?:[\dxX*]+))?(?:\.(?:[\dxX*]+))?(?:-[\w.+-]+)?(?:\+[\w.+-]+)?)|([xX*])(?:-([\w.+-]+))?/g;

function parseAndGroup(groupStr: string): ParsedConstraint[] {
  // Split on commas first, then parse each part for space-separated constraints
  const commaParts = groupStr.split(",").map((s) => s.trim());
  const results: ParsedConstraint[] = [];

  for (const part of commaParts) {
    if (part === "") continue;
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

function parseSingleConstraint(
  opStr: string,
  versionStr: string,
  original: string,
): ParsedConstraint {
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

  if (parts.length >= 1) {
    if (isWildcard(parts[0])) {
      majorDirty = true;
      minorDirty = true;
      patchDirty = true;
    } else {
      major = parseInt(parts[0], 10);
    }
  }

  if (parts.length >= 2) {
    if (isWildcard(parts[1])) {
      minorDirty = true;
      patchDirty = true;
    } else if (!majorDirty) {
      minor = parseInt(parts[1], 10);
    }
  } else if (!majorDirty) {
    // Minor not specified → dirty
    minorDirty = true;
    patchDirty = true;
  }

  if (parts.length >= 3) {
    if (isWildcard(parts[2])) {
      patchDirty = true;
    } else if (!majorDirty && !minorDirty) {
      patch = parseInt(parts[2], 10);
    }
  } else if (!majorDirty && !minorDirty) {
    // Patch not specified → dirty
    patchDirty = true;
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

function findPrereleaseDash(s: string): number {
  // Find the first dash that separates prerelease from version.
  // Must come after a digit or wildcard character and not be inside a version number.
  // E.g., "1.2.3-beta" → dash at index 5. "1.2-beta" → dash at index 3. "*-0" → dash at index 1.
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "-" && i > 0) {
      const before = s[i - 1];
      if (
        (before >= "0" && before <= "9") ||
        before === "*" ||
        before === "x" ||
        before === "X"
      ) {
        return i;
      }
    }
  }
  return -1;
}

function isWildcard(s: string): boolean {
  return s === "*" || s === "x" || s === "X";
}

function normalizeOperator(op: string): Operator {
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

function evalConstraint(
  c: ParsedConstraint,
  v: Version,
  includePrerelease: boolean,
): boolean {
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
function prereleaseGate(
  c: ParsedConstraint,
  v: Version,
  includePrerelease: boolean,
): boolean {
  if (v.prerelease === "") return false; // release version, no gate
  if (includePrerelease) return false; // flag overrides
  if (c.prerelease !== "") return false; // constraint has prerelease, allow
  return true; // reject: version has prerelease but constraint doesn't
}

// --- Equality ---

/**
 * Go's constraintTildeOrEqual: when dirty, delegates to tilde. Otherwise exact equality.
 */
function evalEqual(
  c: ParsedConstraint,
  v: Version,
  includePrerelease: boolean,
): boolean {
  if (prereleaseGate(c, v, includePrerelease)) return false;

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
function evalNotEqual(
  c: ParsedConstraint,
  v: Version,
  includePrerelease: boolean,
): boolean {
  if (prereleaseGate(c, v, includePrerelease)) return false;

  const dirty = c.majorDirty || c.minorDirty || c.patchDirty;
  if (dirty) {
    // Check component by component
    if (c.version.major !== v.major) return true;
    if (c.version.minor !== v.minor && !c.minorDirty) return true;
    if (c.minorDirty) return false; // same major, minor is wildcard → equal

    if (c.version.patch !== v.patch && !c.patchDirty) return true;
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

function evalGreaterThan(
  c: ParsedConstraint,
  v: Version,
  includePrerelease: boolean,
): boolean {
  if (prereleaseGate(c, v, includePrerelease)) return false;

  const dirty = c.majorDirty || c.minorDirty || c.patchDirty;
  if (!dirty) {
    return v.compare(c.version) === 1;
  }

  if (v.major > c.version.major) return true;
  if (v.major < c.version.major) return false;
  if (c.minorDirty) return false; // >1.x: nothing in major 1 is > 1.x

  if (c.patchDirty) {
    return v.minor > c.version.minor;
  }

  return v.compare(c.version) === 1;
}

function evalLessThan(
  c: ParsedConstraint,
  v: Version,
  includePrerelease: boolean,
): boolean {
  if (prereleaseGate(c, v, includePrerelease)) return false;

  // Go's constraintLessThan does NOT use dirty flags — direct comparison.
  return v.compare(c.version) === -1;
}

function evalGreaterThanOrEqual(
  c: ParsedConstraint,
  v: Version,
  includePrerelease: boolean,
): boolean {
  if (prereleaseGate(c, v, includePrerelease)) return false;

  // Go's constraintGreaterThanEqual: no dirty flag handling, direct compare.
  return v.compare(c.version) >= 0;
}

function evalLessThanOrEqual(
  c: ParsedConstraint,
  v: Version,
  includePrerelease: boolean,
): boolean {
  if (prereleaseGate(c, v, includePrerelease)) return false;

  const dirty = c.majorDirty || c.minorDirty || c.patchDirty;
  if (!dirty) {
    return v.compare(c.version) <= 0;
  }

  // Dirty: check component by component
  if (v.major > c.version.major) return false;
  if (v.major === c.version.major && !c.minorDirty && v.minor > c.version.minor) {
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
function evalTilde(
  c: ParsedConstraint,
  v: Version,
  includePrerelease: boolean,
): boolean {
  if (prereleaseGate(c, v, includePrerelease)) return false;

  // v must be >= constraint version
  if (v.compare(c.version) === -1) return false;

  if (c.majorDirty) {
    // ~* matches everything
    return true;
  }

  // Special case from Go: ~0.0.0 (all zero, all specified) matches everything >= 0.0.0
  if (
    c.version.major === 0 &&
    c.version.minor === 0 &&
    c.version.patch === 0 &&
    !c.minorDirty &&
    !c.patchDirty
  ) {
    return true;
  }

  // Must be same major
  if (v.major !== c.version.major) return false;

  if (c.minorDirty) {
    // ~1.x or ~1: allows any minor/patch within major
    return true;
  }

  // Must be same minor
  if (v.minor !== c.version.minor) return false;

  // If patch is dirty, any patch is fine (already checked >= above)
  // If patch is specified, already checked >= above and same minor, so OK
  return true;
}

// --- Caret ---

/**
 * Caret range: allows changes that do not modify the leftmost non-zero digit.
 *
 * ^1.2.3  := >=1.2.3, <2.0.0
 * ^0.2.3  := >=0.2.3, <0.3.0
 * ^0.0.3  := >=0.0.3, <0.0.4
 * ^1.2.x  := >=1.2.0, <2.0.0
 * ^0.0    := >=0.0.0, <0.1.0
 * ^0      := >=0.0.0, <1.0.0
 */
function evalCaret(
  c: ParsedConstraint,
  v: Version,
  includePrerelease: boolean,
): boolean {
  if (prereleaseGate(c, v, includePrerelease)) return false;

  if (c.majorDirty) {
    // ^* makes no sense but treat as match-all
    return true;
  }

  // Must be same major
  if (v.major !== c.version.major) return false;

  if (c.version.major !== 0) {
    // Major > 0: allow any minor/patch within same major, >= constraint
    return versionGte(v, c);
  }

  // Major is 0: leftmost non-zero determines flexibility
  if (c.minorDirty) {
    // ^0.x: >=0.0.0, <1.0.0 → already guaranteed by major === 0
    return true;
  }

  if (v.minor !== c.version.minor) {
    // For 0.x.y, minor must match (minor acts as "major")
    return false;
  }

  if (c.version.minor !== 0) {
    // ^0.2.3: minor > 0, allow patch changes within same minor
    return versionGte(v, c);
  }

  // Minor is 0 too: ^0.0.x
  if (c.patchDirty) {
    // ^0.0.x or ^0.0: >=0.0.0, <0.1.0 → already guaranteed
    return true;
  }

  // ^0.0.3: patch must match exactly (patch acts as "major")
  if (v.patch !== c.version.patch) return false;

  // Same major.minor.patch, compare prerelease
  return comparePrerelease(v.prerelease, c.prerelease) >= 0;
}

/** Check if v >= c's version (considering only non-dirty parts). */
function versionGte(v: Version, c: ParsedConstraint): boolean {
  if (v.major !== c.version.major) return v.major > c.version.major;
  if (c.minorDirty) return true;
  if (v.minor !== c.version.minor) return v.minor > c.version.minor;
  if (c.patchDirty) return true;
  if (v.patch !== c.version.patch) return v.patch > c.version.patch;
  return comparePrerelease(v.prerelease, c.prerelease) >= 0;
}
