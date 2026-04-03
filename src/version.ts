/**
 * Version parsing and comparison, compatible with Masterminds/semver v3.4.0.
 *
 * Source behavior: https://github.com/Masterminds/semver
 * Commit: bf01c618459762fa583c24476ec46957a330c737
 */

// Regex for loose version parsing (matches Go's versionRegexp).
// Accepts optional v prefix, 1-3 numeric parts, optional prerelease and metadata.
const LOOSE_RE =
  /^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([\w.+-]+?))?(?:\+([\w.+-]+?))?$/;

// Regex for strict semver: exactly X.Y.Z with optional prerelease and metadata.
const STRICT_RE = /^(\d+)\.(\d+)\.(\d+)(?:-([\w.+-]+?))?(?:\+([\w.+-]+?))?$/;

export class Version {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly prerelease: string;
  readonly metadata: string;
  readonly original: string;

  constructor(
    major: number,
    minor: number,
    patch: number,
    prerelease: string,
    metadata: string,
    original: string,
  ) {
    this.major = major;
    this.minor = minor;
    this.patch = patch;
    this.prerelease = prerelease;
    this.metadata = metadata;
    this.original = original;
  }

  /**
   * Loose parsing (equivalent to Go's NewVersion with CoerceNewVersion=true).
   * Accepts v prefix, incomplete versions (1, 1.2), leading zeros.
   */
  static parse(raw: string): Version {
    const trimmed = raw.trim();
    const m = LOOSE_RE.exec(trimmed);
    if (!m) {
      throw new Error(`Invalid version: ${raw}`);
    }

    const major = parseInt(m[1], 10);
    const minor = m[2] !== undefined ? parseInt(m[2], 10) : 0;
    const patch = m[3] !== undefined ? parseInt(m[3], 10) : 0;
    const prerelease = m[4] ?? "";
    const metadata = m[5] ?? "";

    if (prerelease) validatePrerelease(prerelease, false);
    if (metadata) validateMetadata(metadata);

    return new Version(major, minor, patch, prerelease, metadata, trimmed);
  }

  /**
   * Try to parse a version string (loose mode). Returns null instead of throwing on invalid input.
   */
  static tryParse(raw: string): Version | null {
    try {
      return Version.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Strict parsing (equivalent to Go's StrictNewVersion).
   * Requires exact X.Y.Z format, no v prefix, no leading zeros.
   */
  static parseStrict(raw: string): Version {
    const trimmed = raw.trim();
    const m = STRICT_RE.exec(trimmed);
    if (!m) {
      throw new Error(`Invalid strict version: ${raw}`);
    }

    const majorStr = m[1];
    const minorStr = m[2];
    const patchStr = m[3];

    // Reject leading zeros
    if (
      (majorStr.length > 1 && majorStr[0] === "0") ||
      (minorStr.length > 1 && minorStr[0] === "0") ||
      (patchStr.length > 1 && patchStr[0] === "0")
    ) {
      throw new Error(`Leading zeros not allowed in strict mode: ${raw}`);
    }

    const major = parseInt(majorStr, 10);
    const minor = parseInt(minorStr, 10);
    const patch = parseInt(patchStr, 10);
    const prerelease = m[4] ?? "";
    const metadata = m[5] ?? "";

    if (prerelease) validatePrerelease(prerelease, true);
    if (metadata) validateMetadata(metadata);

    return new Version(major, minor, patch, prerelease, metadata, trimmed);
  }

  /**
   * Try to parse a version string (strict mode). Returns null instead of throwing on invalid input.
   */
  static tryParseStrict(raw: string): Version | null {
    try {
      return Version.parseStrict(raw);
    } catch {
      return null;
    }
  }

  /**
   * Compare this version to another. Returns -1, 0, or 1.
   * Metadata is ignored. Prerelease versions are less than release versions.
   */
  compare(other: Version): -1 | 0 | 1 {
    if (this.major !== other.major) return this.major < other.major ? -1 : 1;
    if (this.minor !== other.minor) return this.minor < other.minor ? -1 : 1;
    if (this.patch !== other.patch) return this.patch < other.patch ? -1 : 1;
    return comparePrerelease(this.prerelease, other.prerelease);
  }

  eq(other: Version): boolean {
    return this.compare(other) === 0;
  }
  lt(other: Version): boolean {
    return this.compare(other) === -1;
  }
  gt(other: Version): boolean {
    return this.compare(other) === 1;
  }
  lte(other: Version): boolean {
    return this.compare(other) <= 0;
  }
  gte(other: Version): boolean {
    return this.compare(other) >= 0;
  }

  /** Normalized string: "1.2.3", "1.2.3-beta", "1.2.3-beta+meta" */
  toString(): string {
    let s = `${this.major}.${this.minor}.${this.patch}`;
    if (this.prerelease) s += `-${this.prerelease}`;
    if (this.metadata) s += `+${this.metadata}`;
    return s;
  }

  /** Original string as passed to parse(). */
  toOriginalString(): string {
    return this.original;
  }
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
export function comparePrerelease(a: string, b: string): -1 | 0 | 1 {
  if (a === b) return 0;
  if (a === "" && b !== "") return 1; // release > prerelease
  if (a !== "" && b === "") return -1; // prerelease < release

  const aParts = a.split(".");
  const bParts = b.split(".");
  const len = Math.max(aParts.length, bParts.length);

  for (let i = 0; i < len; i++) {
    if (i >= aParts.length) return -1; // fewer segments = less
    if (i >= bParts.length) return 1;

    const aVal = aParts[i];
    const bVal = bParts[i];

    if (aVal === bVal) continue;

    const aIsNum = isNumeric(aVal);
    const bIsNum = isNumeric(bVal);

    if (aIsNum && bIsNum) {
      const an = parseInt(aVal, 10);
      const bn = parseInt(bVal, 10);
      if (an < bn) return -1;
      if (an > bn) return 1;
      continue;
    }

    // Numeric identifiers always have lower precedence than alphanumeric
    if (aIsNum && !bIsNum) return -1;
    if (!aIsNum && bIsNum) return 1;

    // Both alphanumeric: lexical comparison
    if (aVal < bVal) return -1;
    if (aVal > bVal) return 1;
  }

  return 0;
}

function isNumeric(s: string): boolean {
  if (s.length === 0) return false;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 48 || c > 57) return false; // not 0-9
  }
  return true;
}

/** Validate prerelease identifiers. In strict mode, reject leading zeros on numeric segments. */
function validatePrerelease(pre: string, strict: boolean): void {
  const segments = pre.split(".");
  for (const seg of segments) {
    if (seg === "") {
      throw new Error(`Empty prerelease segment in: ${pre}`);
    }
    // Check for invalid characters
    for (let i = 0; i < seg.length; i++) {
      const c = seg.charCodeAt(i);
      const valid =
        (c >= 48 && c <= 57) || // 0-9
        (c >= 65 && c <= 90) || // A-Z
        (c >= 97 && c <= 122) || // a-z
        c === 45; // hyphen
      if (!valid) {
        throw new Error(`Invalid character in prerelease: ${pre}`);
      }
    }
    // Strict: no leading zeros on numeric identifiers
    if (strict && isNumeric(seg) && seg.length > 1 && seg[0] === "0") {
      throw new Error(`Leading zeros in numeric prerelease identifier: ${seg}`);
    }
  }
}

/** Validate metadata identifiers. */
function validateMetadata(meta: string): void {
  const segments = meta.split(".");
  for (const seg of segments) {
    if (seg === "") {
      throw new Error(`Empty metadata segment in: ${meta}`);
    }
    for (let i = 0; i < seg.length; i++) {
      const c = seg.charCodeAt(i);
      const valid =
        (c >= 48 && c <= 57) ||
        (c >= 65 && c <= 90) ||
        (c >= 97 && c <= 122) ||
        c === 45;
      if (!valid) {
        throw new Error(`Invalid character in metadata: ${meta}`);
      }
    }
  }
}

/** Sort an array of versions in ascending order. Returns a new array. */
export function sort(versions: Version[]): Version[] {
  return [...versions].sort((a, b) => a.compare(b));
}
