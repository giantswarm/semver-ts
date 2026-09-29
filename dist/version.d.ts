/**
 * Version parsing and comparison, compatible with Masterminds/semver v3.4.0.
 *
 * Source behavior: https://github.com/Masterminds/semver
 * Commit: bf01c618459762fa583c24476ec46957a330c737
 */
export declare class Version {
    readonly major: number;
    readonly minor: number;
    readonly patch: number;
    readonly prerelease: string;
    readonly metadata: string;
    readonly original: string;
    constructor(major: number, minor: number, patch: number, prerelease: string, metadata: string, original: string);
    /**
     * Loose parsing (equivalent to Go's NewVersion with CoerceNewVersion=true).
     * Accepts v prefix, incomplete versions (1, 1.2), leading zeros.
     */
    static parse(raw: string): Version;
    /**
     * Try to parse a version string (loose mode). Returns null instead of throwing on invalid input.
     */
    static tryParse(raw: string): Version | null;
    /**
     * Strict parsing (equivalent to Go's StrictNewVersion).
     * Requires exact X.Y.Z format, no v prefix, no leading zeros.
     */
    static parseStrict(raw: string): Version;
    /**
     * Try to parse a version string (strict mode). Returns null instead of throwing on invalid input.
     */
    static tryParseStrict(raw: string): Version | null;
    /**
     * Compare this version to another. Returns -1, 0, or 1.
     * Metadata is ignored. Prerelease versions are less than release versions.
     */
    compare(other: Version): -1 | 0 | 1;
    eq(other: Version): boolean;
    lt(other: Version): boolean;
    gt(other: Version): boolean;
    lte(other: Version): boolean;
    gte(other: Version): boolean;
    /** Normalized string: "1.2.3", "1.2.3-beta", "1.2.3-beta+meta" */
    toString(): string;
    /** Original string as passed to parse(). */
    toOriginalString(): string;
}
/**
 * Compare prerelease strings per SemVer spec section 11.
 *
 * - No prerelease > has prerelease (release is greater)
 * - Split by dots, compare segment by segment
 * - Numeric segments compared numerically
 * - String segments compared lexically
 * - Numeric segments are less than string segments
 * - Fewer segments < more segments (if all preceding are equal)
 */
export declare function comparePrerelease(a: string, b: string): -1 | 0 | 1;
/** Sort an array of versions in ascending order. Returns a new array. */
export declare function sort(versions: Version[]): Version[];
//# sourceMappingURL=version.d.ts.map