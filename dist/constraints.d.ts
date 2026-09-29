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
     * `check` only admits pre-releases then.
     *
     * Upper bounds and `!=` exclusions do not move the lower bound: when the
     * lowest candidate of a group is excluded (`>=1.2.3 !=1.2.3`), that group
     * yields no version.
     */
    minVersion(): Version | null;
    /**
     * The highest of the given versions that satisfies this constraint, or null
     * when none does. This is the version Flux selects for an OCIRepository or
     * HelmRepository semver range.
     */
    maxSatisfying(versions: readonly Version[], options?: CheckOptions): Version | null;
    toString(): string;
    private lowestOfGroup;
    private checkGroup;
}
//# sourceMappingURL=constraints.d.ts.map