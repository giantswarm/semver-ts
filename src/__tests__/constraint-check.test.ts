import { describe, it, expect } from "vitest";
import { Version } from "../version.js";
import { Constraints } from "../constraints.js";
import { constraintTests } from "./test-data/constraints.js";
import { constraintPrereleaseTests } from "./test-data/constraints-prerelease.js";

describe("Constraint checks", () => {
  for (const tc of constraintTests) {
    const label = `satisfies("${tc.version}", "${tc.constraint}") === ${tc.expected}`;
    it(label, () => {
      const v = Version.parse(tc.version);
      const c = Constraints.parse(tc.constraint);
      expect(c.check(v)).toBe(tc.expected);
    });
  }
});

describe("Constraint checks (includePrerelease)", () => {
  for (const tc of constraintPrereleaseTests) {
    const label = `satisfiesWithPrerelease("${tc.version}", "${tc.constraint}") === ${tc.expected}`;
    it(label, () => {
      const v = Version.parse(tc.version);
      const c = Constraints.parse(tc.constraint);
      expect(c.check(v, { includePrerelease: true })).toBe(tc.expected);
    });
  }
});
