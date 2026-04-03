/**
 * Test cases from Masterminds/semver version_test.go TestStrictNewVersion and TestNewVersion
 *
 * Source: https://github.com/Masterminds/semver
 * Version: v3.4.0 (commit bf01c618459762fa583c24476ec46957a330c737, master as of 2026-04-03)
 * File: version_test.go
 */

export const strictParsingTests: { version: string; valid: boolean }[] = [
  // Valid strict versions
  { version: "1.2.3", valid: true },
  { version: "1.2.3+test.01", valid: true },
  { version: "1.2.3-alpha.-1", valid: true },
  { version: "1.2.0-x.Y.0+metadata", valid: true },
  { version: "1.2.0-x.Y.0+metadata-width-hypen", valid: true },
  { version: "1.2.3-rc1-with-hypen", valid: true },
  { version: "1.2.3-0abc123", valid: true },
  { version: "1.2.2147483648", valid: true },
  { version: "1.2147483648.3", valid: true },
  { version: "2147483648.3.0", valid: true },

  // Invalid strict versions
  { version: "v1.2.3", valid: false },
  { version: "1.0", valid: false },
  { version: "v1.0", valid: false },
  { version: "1", valid: false },
  { version: "v1", valid: false },
  { version: "1.2", valid: false },
  { version: "1.2.beta", valid: false },
  { version: "v1.2.beta", valid: false },
  { version: "foo", valid: false },
  { version: "1.2-5", valid: false },
  { version: "v1.2-5", valid: false },
  { version: "1.2-beta.5", valid: false },
  { version: "v1.2-beta.5", valid: false },
  { version: "\n1.2", valid: false },
  { version: "\nv1.2", valid: false },
  { version: "v1.2.0-x.Y.0+metadata", valid: false },
  { version: "1.2.3-beta.01", valid: false },
  { version: "v1.2.3-rc1-with-hypen", valid: false },
  { version: "1.2.3.4", valid: false },
  { version: "v1.2.3.4", valid: false },
  { version: "20221209-update-renovatejson-v4", valid: false },
  { version: "1.1.2+.123", valid: false },
  { version: "1.0.0-alpha_beta", valid: false },
  { version: "1.0.0-alpha..", valid: false },
  { version: "1.0.0-alpha..1", valid: false },
  { version: "01.1.1", valid: false },
  { version: "1.01.1", valid: false },
  { version: "1.1.01", valid: false },
  { version: "9.8.7+meta+meta", valid: false },
  { version: "1.2.31----RC-SNAPSHOT.12.09.1--.12+788", valid: false },
  { version: "1.2.3-0123", valid: false },
  { version: "1.2.3-0123.0123", valid: false },
  { version: "+invalid", valid: false },
  { version: "-invalid", valid: false },
  { version: "-invalid.01", valid: false },
  { version: "alpha+beta", valid: false },
  { version: "1.2.3-alpha_beta+foo", valid: false },
];

export const looseParsingTests: { version: string; valid: boolean }[] = [
  // Valid in loose mode (in addition to all strict-valid)
  { version: "v1.2.3", valid: true },
  { version: "1.0", valid: true },
  { version: "v1.0", valid: true },
  { version: "1", valid: true },
  { version: "v1", valid: true },
  { version: "1.2-5", valid: true },
  { version: "v1.2-5", valid: true },
  { version: "1.2-beta.5", valid: true },
  { version: "v1.2-beta.5", valid: true },
  { version: "v1.2.0-x.Y.0+metadata", valid: true },
  { version: "v1.2.0-x.Y.0+metadata-width-hypen", valid: true },
  { version: "v1.2.3-rc1-with-hypen", valid: true },
  { version: "20221209-update-renovatejson-v4", valid: true },
  { version: "01.1.1", valid: true },
  { version: "1.01.1", valid: true },
  { version: "1.1.01", valid: true },

  // Still invalid in loose mode
  { version: "foo", valid: false },
  { version: "1.2.beta", valid: false },
  { version: "v1.2.beta", valid: false },
  { version: "1.2.3.4", valid: false },
  { version: "v1.2.3.4", valid: false },
];
