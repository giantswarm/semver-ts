/**
 * Constraint parsing and checking, compatible with Masterminds/semver v3.4.0.
 *
 * Source behavior: https://github.com/Masterminds/semver
 * Commit: bf01c618459762fa583c24476ec46957a330c737
 */
import { Version } from "./version.js";
export interface CheckOptions {
    /** When true, prerelease versions satisfy constraints even without a prerelease tag. */
    includePrerelease?: boolean;
}
export declare class Constraints {
    private groups;
    private originalString;
    private constructor();
    /**
     * Parse a constraint string. Supports all Masterminds/semver syntax:
     * operators (=, !=, >, <, >=, <=), tilde (~), caret (^), wildcards (*, x, X),
     * hyphen ranges (1.0 - 2.0), AND (comma or space), OR (||).
     */
    static parse(constraint: string): Constraints;
    /**
     * Try to parse a constraint string. Returns null instead of throwing on invalid input.
     */
    static tryParse(constraint: string): Constraints | null;
    /**
     * Check if a version satisfies this constraint.
     */
    check(version: Version, options?: CheckOptions): boolean;
    /**
     * Validate a version against this constraint, returning errors.
     */
    validate(version: Version, options?: CheckOptions): {
        satisfied: boolean;
        errors: string[];
    };
    /**
     * The lowest version that satisfies this constraint, or null when no version
     * does. A pre-release is only returned when the constraint names one, as
     * `check` only admits pre-releases then. The result carries no metadata, and
     * `toOriginalString()` equals `toString()`.
     */
    minVersion(): Version | null;
    /**
     * The highest of the given versions that satisfies this constraint, or null
     * when none does, as Flux selects the version for a semver range. Of
     * versions with equal precedence (`1.2.3+a`, `1.2.3+b`) the first given is
     * returned; Flux does not define which one it picks.
     */
    maxSatisfying(versions: readonly Version[], options?: CheckOptions): Version | null;
    toString(): string;
    /**
     * Starts at the lowest version at all and moves up past every constraint
     * that rejects the candidate. Each step only skips versions the rejecting
     * constraint rules out, so the first accepted candidate is the lowest; an
     * upper bound rejecting it means no version satisfies the group.
     */
    private lowestOfGroup;
    private checkGroup;
}
//# sourceMappingURL=constraints.d.ts.map