/**
 * Test cases from Masterminds/semver version_test.go TestCompare
 *
 * Source: https://github.com/Masterminds/semver
 * Version: v3.4.0 (commit bf01c618459762fa583c24476ec46957a330c737, master as of 2026-04-03)
 * File: version_test.go
 */
export const versionComparisonTests: {
  v1: string;
  v2: string;
  expected: -1 | 0 | 1;
}[] = [
  { v1: "1.2.3", v2: "1.5.1", expected: -1 },
  { v1: "2.2.3", v2: "1.5.1", expected: 1 },
  { v1: "2.2.3", v2: "2.2.2", expected: 1 },
  { v1: "3.2-beta", v2: "3.2-beta", expected: 0 },
  { v1: "1.3", v2: "1.1.4", expected: 1 },
  { v1: "4.2", v2: "4.2-beta", expected: 1 },
  { v1: "4.2-beta", v2: "4.2", expected: -1 },
  { v1: "4.2-alpha", v2: "4.2-beta", expected: -1 },
  { v1: "4.2-alpha", v2: "4.2-alpha", expected: 0 },
  { v1: "4.2-beta.2", v2: "4.2-beta.1", expected: 1 },
  { v1: "4.2-beta2", v2: "4.2-beta1", expected: 1 },
  { v1: "4.2-beta", v2: "4.2-beta.2", expected: -1 },
  { v1: "4.2-beta", v2: "4.2-beta.foo", expected: -1 },
  { v1: "4.2-beta.2", v2: "4.2-beta", expected: 1 },
  { v1: "4.2-beta.foo", v2: "4.2-beta", expected: 1 },
  { v1: "1.2+bar", v2: "1.2+baz", expected: 0 },
  { v1: "1.0.0-beta.4", v2: "1.0.0-beta.-2", expected: -1 },
  { v1: "1.0.0-beta.-2", v2: "1.0.0-beta.-3", expected: -1 },
  { v1: "1.0.0-beta.-3", v2: "1.0.0-beta.5", expected: 1 },
];
