/**
 * Test cases from Masterminds/semver constraints_test.go
 * Combined from TestConstraintCheck and TestConstraintsCheck
 *
 * Source: https://github.com/Masterminds/semver
 * Version: v3.4.0 (commit bf01c618459762fa583c24476ec46957a330c737, master as of 2026-04-03)
 * File: constraints_test.go
 */
export const constraintTests: {
  constraint: string;
  version: string;
  expected: boolean;
}[] = [
  // === TestConstraintCheck: Basic operators ===

  // Equality
  { constraint: "=2.0.0", version: "1.2.3", expected: false },
  { constraint: "=2.0.0", version: "2.0.0", expected: true },
  { constraint: "=2.0", version: "1.2.3", expected: false },
  { constraint: "=2.0", version: "2.0.0", expected: true },
  { constraint: "=2.0", version: "2.0.1", expected: true },
  { constraint: "4.1", version: "4.1.0", expected: true },

  // Not equal
  { constraint: "!=4.1.0", version: "4.1.0", expected: false },
  { constraint: "!=4.1.0", version: "4.1.1", expected: true },
  { constraint: "!=4.1", version: "4.1.0", expected: false },
  { constraint: "!=4.1", version: "4.1.1", expected: false },
  { constraint: "!=4.1", version: "5.1.0-alpha.1", expected: false },
  { constraint: "!=4.1.0", version: "5.1.0-alpha.1", expected: false },
  { constraint: "!=4.1-alpha", version: "4.1.0", expected: true },
  { constraint: "!=4.1", version: "5.1.0", expected: true },

  // Less than
  { constraint: "<11", version: "0.1.0", expected: true },
  { constraint: "<11", version: "11.1.0", expected: false },
  { constraint: "<1.1", version: "0.1.0", expected: true },
  { constraint: "<1.1", version: "1.1.0", expected: false },
  { constraint: "<1.1", version: "1.1.1", expected: false },

  // Less than or equal
  { constraint: "<=11", version: "1.2.3", expected: true },
  { constraint: "<=11", version: "12.2.3", expected: false },
  { constraint: "<=11", version: "11.2.3", expected: true },
  { constraint: "<=1.1", version: "1.2.3", expected: false },
  { constraint: "<=1.1", version: "0.1.0", expected: true },
  { constraint: "<=1.1", version: "1.1.0", expected: true },
  { constraint: "<=1.1", version: "1.1.1", expected: true },

  // Greater than
  { constraint: ">1.1", version: "4.1.0", expected: true },
  { constraint: ">1.1", version: "1.1.0", expected: false },
  { constraint: ">0", version: "0", expected: false },
  { constraint: ">0", version: "1", expected: true },
  { constraint: ">0", version: "0.0.1-alpha", expected: false },
  { constraint: ">0.0", version: "0.0.1-alpha", expected: false },
  { constraint: ">0-0", version: "0.0.1-alpha", expected: false },
  { constraint: ">0.0-0", version: "0.0.1-alpha", expected: false },
  { constraint: ">0", version: "0.0.0-alpha", expected: false },
  { constraint: ">0-0", version: "0.0.0-alpha", expected: false },
  { constraint: ">0.0.0-0", version: "0.0.0-alpha", expected: true },
  { constraint: ">1.2.3-alpha.1", version: "1.2.3-alpha.2", expected: true },
  { constraint: ">1.2.3-alpha.1", version: "1.3.3-alpha.2", expected: true },
  { constraint: ">11", version: "11.1.0", expected: false },
  { constraint: ">11.1", version: "11.1.0", expected: false },
  { constraint: ">11.1", version: "11.1.1", expected: false },
  { constraint: ">11.1", version: "11.2.1", expected: true },

  // Greater than or equal
  { constraint: ">=11", version: "11.1.2", expected: true },
  { constraint: ">=11.1", version: "11.1.2", expected: true },
  { constraint: ">=11.1", version: "11.0.2", expected: false },
  { constraint: ">=1.1", version: "4.1.0", expected: true },
  { constraint: ">=1.1", version: "1.1.0", expected: true },
  { constraint: ">=1.1", version: "0.0.9", expected: false },
  { constraint: ">=0", version: "0.0.1-alpha", expected: false },
  { constraint: ">=0.0", version: "0.0.1-alpha", expected: false },
  { constraint: ">=0-0", version: "0.0.1-alpha", expected: true },
  { constraint: ">=0.0-0", version: "0.0.1-alpha", expected: true },
  { constraint: ">=0", version: "0.0.0-alpha", expected: false },
  { constraint: ">=0-0", version: "0.0.0-alpha", expected: true },
  { constraint: ">=0.0.0-0", version: "0.0.0-alpha", expected: true },
  { constraint: ">=0.0.0-0", version: "1.2.3", expected: true },
  { constraint: ">=0.0.0-0", version: "3.4.5-beta.1", expected: true },
  { constraint: "<0", version: "0.0.0-alpha", expected: false },
  { constraint: "<0-z", version: "0.0.0-alpha", expected: true },
  { constraint: ">=0", version: "0", expected: true },
  { constraint: "=0", version: "1", expected: false },

  // Wildcards
  { constraint: "*", version: "1", expected: true },
  { constraint: "*", version: "4.5.6", expected: true },
  { constraint: "*", version: "1.2.3-alpha.1", expected: false },
  { constraint: "*-0", version: "1.2.3-alpha.1", expected: true },
  { constraint: "2.*", version: "1", expected: false },
  { constraint: "2.*", version: "3.4.5", expected: false },
  { constraint: "2.*", version: "2.1.1", expected: true },
  { constraint: "2.1.*", version: "2.1.1", expected: true },
  { constraint: "2.1.*", version: "2.2.1", expected: false },

  // Empty constraint (same as *)
  { constraint: "", version: "1", expected: true },
  { constraint: "", version: "4.5.6", expected: true },
  { constraint: "", version: "1.2.3-alpha.1", expected: false },

  // Bare version as constraint (implicit =)
  { constraint: "2", version: "1", expected: false },
  { constraint: "2", version: "3.4.5", expected: false },
  { constraint: "2", version: "2.1.1", expected: true },
  { constraint: "2.1", version: "2.1.1", expected: true },
  { constraint: "2.1", version: "2.2.1", expected: false },

  // Tilde
  { constraint: "~1.2.3", version: "1.2.4", expected: true },
  { constraint: "~1.2.3", version: "1.3.4", expected: false },
  { constraint: "~1.2", version: "1.2.4", expected: true },
  { constraint: "~1.2", version: "1.3.4", expected: false },
  { constraint: "~1", version: "1.2.4", expected: true },
  { constraint: "~1", version: "2.3.4", expected: false },
  { constraint: "~0.2.3", version: "0.2.5", expected: true },
  { constraint: "~0.2.3", version: "0.3.5", expected: false },
  { constraint: "~1.2.3-beta.2", version: "1.2.3-beta.4", expected: true },
  { constraint: "~1.2.3-beta.2", version: "1.2.4-beta.2", expected: true },
  { constraint: "~1.2.3-beta.2", version: "1.3.4-beta.2", expected: false },

  // Caret
  { constraint: "^1.2.3", version: "1.8.9", expected: true },
  { constraint: "^1.2.3", version: "2.8.9", expected: false },
  { constraint: "^1.2.3", version: "1.2.1", expected: false },
  { constraint: "^1.1.0", version: "2.1.0", expected: false },
  { constraint: "^1.2.0", version: "2.2.1", expected: false },
  { constraint: "^1.2.0", version: "1.2.1-alpha.1", expected: false },
  { constraint: "^1.2.0-alpha.0", version: "1.2.1-alpha.1", expected: true },
  { constraint: "^1.2.0-alpha.0", version: "1.2.1-alpha.0", expected: true },
  { constraint: "^1.2.0-alpha.2", version: "1.2.0-alpha.1", expected: false },
  { constraint: "^1.2", version: "1.8.9", expected: true },
  { constraint: "^1.2", version: "2.8.9", expected: false },
  { constraint: "^1", version: "1.8.9", expected: true },
  { constraint: "^1", version: "2.8.9", expected: false },
  { constraint: "^0.2.3", version: "0.2.5", expected: true },
  { constraint: "^0.2.3", version: "0.5.6", expected: false },
  { constraint: "^0.2", version: "0.2.5", expected: true },
  { constraint: "^0.2", version: "0.5.6", expected: false },
  { constraint: "^0.0.3", version: "0.0.3", expected: true },
  { constraint: "^0.0.3", version: "0.0.4", expected: false },
  { constraint: "^0.0", version: "0.0.3", expected: true },
  { constraint: "^0.0", version: "0.1.4", expected: false },
  { constraint: "^0.0", version: "1.0.4", expected: false },
  { constraint: "^0", version: "0.2.3", expected: true },
  { constraint: "^0", version: "1.1.4", expected: false },
  { constraint: "^0.2.3-beta.2", version: "0.2.3-beta.4", expected: true },
  { constraint: "^0.2.3-beta.2", version: "0.2.4-beta.2", expected: true },
  { constraint: "^0.2.3-beta.2", version: "0.3.4-beta.2", expected: false },
  { constraint: "^0.2.3-beta.2", version: "0.2.3-beta.2", expected: true },

  // === TestConstraintsCheck: Complex constraints ===

  { constraint: "*", version: "1.2.3", expected: true },
  { constraint: "~0.0.0", version: "1.2.3", expected: true },
  { constraint: "0.x.x", version: "1.2.3", expected: false },
  { constraint: "0.0.x", version: "1.2.3", expected: false },
  { constraint: "0.0.0", version: "1.2.3", expected: false },
  { constraint: "^0.0.0", version: "1.2.3", expected: false },
  { constraint: "= 2.0", version: "1.2.3", expected: false },
  { constraint: "= 2.0", version: "2.0.0", expected: true },
  { constraint: "4.1", version: "4.1.0", expected: true },
  { constraint: "4.1.x", version: "4.1.3", expected: true },
  { constraint: "1.x", version: "1.4", expected: true },

  // != with wildcards
  { constraint: "!=4.1", version: "4.1.0", expected: false },
  { constraint: "!=4.1-alpha", version: "4.1.0-alpha", expected: false },
  { constraint: "!=4.1-alpha", version: "4.1.1-alpha", expected: false },
  { constraint: "!=4.1-alpha", version: "4.1.0", expected: true },
  { constraint: "!=4.1", version: "5.1.0", expected: true },
  { constraint: "!=4.x", version: "5.1.0", expected: true },
  { constraint: "!=4.x", version: "4.1.0", expected: false },
  { constraint: "!=4.1.x", version: "4.2.0", expected: true },
  { constraint: "!=4.2.x", version: "4.2.3", expected: false },

  // Basic operators in multi-constraint context
  { constraint: ">1.1", version: "4.1.0", expected: true },
  { constraint: ">1.1", version: "1.1.0", expected: false },
  { constraint: "<1.1", version: "0.1.0", expected: true },
  { constraint: "<1.1", version: "1.1.0", expected: false },
  { constraint: "<1.1", version: "1.1.1", expected: false },
  { constraint: "<1.x", version: "1.1.1", expected: false },
  { constraint: "<1.x", version: "0.1.1", expected: true },
  { constraint: "<1.x", version: "2.0.0", expected: false },
  { constraint: "<1.1.x", version: "1.2.1", expected: false },
  { constraint: "<1.1.x", version: "1.1.500", expected: false },
  { constraint: "<1.1.x", version: "1.0.500", expected: true },
  { constraint: "<1.2.x", version: "1.1.1", expected: true },
  { constraint: ">=1.1", version: "4.1.0", expected: true },
  { constraint: ">=1.1", version: "4.1.0-beta", expected: false },
  { constraint: ">=1.1", version: "1.1.0", expected: true },
  { constraint: ">=1.1", version: "0.0.9", expected: false },
  { constraint: "<=1.1", version: "0.1.0", expected: true },
  { constraint: "<=1.1", version: "0.1.0-alpha", expected: false },
  { constraint: "<=1.1-a", version: "0.1.0-alpha", expected: true },
  { constraint: "<=1.1", version: "1.1.0", expected: true },
  { constraint: "<=1.x", version: "1.1.0", expected: true },
  { constraint: "<=2.x", version: "3.0.0", expected: false },
  { constraint: "<=1.1", version: "1.1.1", expected: true },
  { constraint: "<=1.1.x", version: "1.2.500", expected: false },
  { constraint: "<=4.5", version: "3.4.0", expected: true },
  { constraint: "<=4.5", version: "3.7.0", expected: true },
  { constraint: "<=4.5", version: "4.6.3", expected: false },

  // Comma-separated AND
  { constraint: ">1.1, <2", version: "1.1.1", expected: false },
  { constraint: ">1.1, <2", version: "1.2.1", expected: true },
  { constraint: ">1.1, <3", version: "4.3.2", expected: false },
  { constraint: ">=1.1, <2, !=1.2.3", version: "1.2.3", expected: false },

  // Space-separated AND
  { constraint: ">1.1 <2", version: "1.1.1", expected: false },
  { constraint: ">1.1 <2", version: "1.2.1", expected: true },
  { constraint: ">1.1    <3", version: "4.3.2", expected: false },
  { constraint: ">=1.1    <2    !=1.2.3", version: "1.2.3", expected: false },

  // OR with ||
  { constraint: ">=1.1, <2, !=1.2.3 || > 3", version: "4.1.2", expected: true },
  {
    constraint: ">=1.1, <2, !=1.2.3 || > 3",
    version: "3.1.2",
    expected: false,
  },
  {
    constraint: ">=1.1, <2, !=1.2.3 || >= 3",
    version: "3.0.0",
    expected: true,
  },
  {
    constraint: ">=1.1, <2, !=1.2.3 || > 3",
    version: "3.0.0",
    expected: false,
  },
  {
    constraint: ">=1.1, <2, !=1.2.3 || > 3",
    version: "1.2.3",
    expected: false,
  },

  // Space-separated AND with OR
  { constraint: ">=1.1 <2 !=1.2.3", version: "1.2.3", expected: false },
  { constraint: ">=1.1 <2 !=1.2.3 || > 3", version: "4.1.2", expected: true },
  { constraint: ">=1.1 <2 !=1.2.3 || > 3", version: "3.1.2", expected: false },
  { constraint: ">=1.1 <2 !=1.2.3 || >= 3", version: "3.0.0", expected: true },
  { constraint: ">=1.1 <2 !=1.2.3 || > 3", version: "3.0.0", expected: false },
  { constraint: ">=1.1 <2 !=1.2.3 || > 3", version: "1.2.3", expected: false },

  // Extra whitespace variants (comma-separated)
  { constraint: "> 1.1, <     2", version: "1.1.1", expected: false },
  { constraint: ">   1.1, <2", version: "1.2.1", expected: true },
  { constraint: ">1.1, <  3", version: "4.3.2", expected: false },
  { constraint: ">= 1.1, <     2, !=1.2.3", version: "1.2.3", expected: false },

  // Extra whitespace variants (space-separated)
  { constraint: "> 1.1 < 2", version: "1.1.1", expected: false },
  { constraint: ">1.1 < 2", version: "1.2.1", expected: true },
  { constraint: "> 1.1    <3", version: "4.3.2", expected: false },
  { constraint: ">=1.1    < 2    != 1.2.3", version: "1.2.3", expected: false },

  // Extra whitespace with OR (comma-separated)
  {
    constraint: ">= 1.1, <2, !=1.2.3 || > 3",
    version: "4.1.2",
    expected: true,
  },
  {
    constraint: ">= 1.1, <2, != 1.2.3 || > 3",
    version: "3.1.2",
    expected: false,
  },
  {
    constraint: ">= 1.1, <2, != 1.2.3 || >= 3",
    version: "3.0.0",
    expected: true,
  },
  {
    constraint: ">= 1.1, <2, !=1.2.3 || > 3",
    version: "3.0.0",
    expected: false,
  },
  {
    constraint: ">= 1.1, <2, !=1.2.3 || > 3",
    version: "1.2.3",
    expected: false,
  },

  // Extra whitespace with OR (space-separated)
  { constraint: ">= 1.1 <2 != 1.2.3", version: "1.2.3", expected: false },
  { constraint: ">= 1.1 <2 != 1.2.3 || > 3", version: "4.1.2", expected: true },
  {
    constraint: ">= 1.1 <2 != 1.2.3 || > 3",
    version: "3.1.2",
    expected: false,
  },
  {
    constraint: ">= 1.1 <2 != 1.2.3 || >= 3",
    version: "3.0.0",
    expected: true,
  },
  {
    constraint: ">= 1.1 < 2 !=1.2.3 || > 3",
    version: "3.0.0",
    expected: false,
  },
  { constraint: ">=1.1 < 2 !=1.2.3 || > 3", version: "1.2.3", expected: false },

  // Prerelease in constraints with range bounds
  {
    constraint: ">= 1.0.0  <= 2.0.0-beta",
    version: "1.0.1-beta",
    expected: true,
  },
  { constraint: ">= 1.0.0  <= 2.0.0-beta", version: "1.0.1", expected: true },
  { constraint: ">= 1.0.0  <= 2.0.0-beta", version: "3.0.0", expected: false },
  {
    constraint: ">= 1.0.0  <= 2.0.0-beta || > 3",
    version: "1.0.1-beta",
    expected: true,
  },
  {
    constraint: ">= 1.0.0  <= 2.0.0-beta || > 3",
    version: "3.0.1-beta",
    expected: false,
  },
  {
    constraint: ">= 1.0.0  <= 2.0.0-beta != 1.0.1 || > 3",
    version: "1.0.1-beta",
    expected: true,
  },
  {
    constraint: ">= 1.0.0  <= 2.0.0-beta != 1.0.1-beta || > 3",
    version: "1.0.1-beta",
    expected: false,
  },
  { constraint: ">= 1.0.0-0  <= 2.0.0", version: "1.0.1-beta", expected: true },

  // Hyphen ranges
  { constraint: "1.1 - 2", version: "1.1.1", expected: true },
  { constraint: "1.5.0 - 4.5", version: "3.7.0", expected: true },
  { constraint: "1.1-3", version: "4.3.2", expected: false },

  // Caret in multi-constraint context
  { constraint: "^1.1", version: "1.1.1", expected: true },
  { constraint: "^1.1", version: "4.3.2", expected: false },
  { constraint: "^1.x", version: "1.1.1", expected: true },
  { constraint: "^2.x", version: "1.1.1", expected: false },
  { constraint: "^1.x", version: "2.1.1", expected: false },
  { constraint: "^1.x", version: "1.1.1-beta1", expected: false },
  { constraint: "^1.1.2-alpha", version: "1.2.1-beta1", expected: true },
  { constraint: "^1.2.x-alpha", version: "1.1.1-beta1", expected: false },
  { constraint: "^0.0.1", version: "0.0.1", expected: true },
  { constraint: "^0.0.1", version: "0.3.1", expected: false },

  // Tilde in multi-constraint context
  { constraint: "~*", version: "2.1.1", expected: true },
  { constraint: "~1", version: "2.1.1", expected: false },
  { constraint: "~1", version: "1.3.5", expected: true },
  { constraint: "~1", version: "1.4", expected: true },
  { constraint: "~1.x", version: "2.1.1", expected: false },
  { constraint: "~1.x", version: "1.3.5", expected: true },
  { constraint: "~1.x", version: "1.4", expected: true },
  { constraint: "~1.1", version: "1.1.1", expected: true },
  { constraint: "~1.1", version: "1.1.1-alpha", expected: false },
  { constraint: "~1.1-alpha", version: "1.1.1-beta", expected: true },
  { constraint: "~1.1.1-beta", version: "1.1.1-alpha", expected: false },
  { constraint: "~1.1.1-beta", version: "1.1.1", expected: true },
  { constraint: "~1.2.3", version: "1.2.5", expected: true },
  { constraint: "~1.2.3", version: "1.2.2", expected: false },
  { constraint: "~1.2.3", version: "1.3.2", expected: false },
  { constraint: "~1.1", version: "1.2.3", expected: false },
  { constraint: "~1.3", version: "2.4.5", expected: false },

  // Combined hyphen + operator
  { constraint: "1.0.0 - 2.0.0 <=2.0.0", version: "1.5.0", expected: true },
  { constraint: "1.0.0 - 2.0.0, <=2.0.0", version: "1.5.0", expected: true },
];
