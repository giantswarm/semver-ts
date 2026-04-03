/**
 * Test cases from Masterminds/semver constraints_test.go TestConstraintsCheckIncludePrerelease
 *
 * Source: https://github.com/Masterminds/semver
 * Version: v3.4.0 (commit bf01c618459762fa583c24476ec46957a330c737, master as of 2026-04-03)
 * File: constraints_test.go
 */
export const constraintPrereleaseTests: {
  constraint: string;
  version: string;
  expected: boolean;
}[] = [
  { constraint: ">=1.1", version: "4.1.0-beta", expected: true },
  { constraint: ">1.1", version: "4.1.0-beta", expected: true },
  { constraint: "<=1.1", version: "0.1.0-alpha", expected: true },
  { constraint: "<1.1", version: "0.1.0-alpha", expected: true },
  { constraint: "^1.x", version: "1.1.1-beta1", expected: true },
  { constraint: "~1.1", version: "1.1.1-alpha", expected: true },
  { constraint: "*", version: "1.2.3-alpha", expected: true },
  { constraint: "= 2.0", version: "2.0.1-beta", expected: true },
  { constraint: "^1.1.2-alpha", version: "1.2.1-beta1", expected: true },
  { constraint: "~1.1-alpha", version: "1.1.1-beta", expected: true },
  { constraint: "~1.1.1-beta", version: "1.1.1", expected: true },
  { constraint: "~1.3.6-alpha", version: "1.3.5-beta", expected: false },
  { constraint: "~1.3.5-alpha", version: "1.3.5-beta", expected: true },
  { constraint: "~1.3.5-beta", version: "1.3.5-alpha", expected: false },
];
