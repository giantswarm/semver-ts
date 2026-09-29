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
    toString(): string;
    private checkGroup;
}
//# sourceMappingURL=constraints.d.ts.map