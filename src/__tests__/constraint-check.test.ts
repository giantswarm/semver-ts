import { describe, it, expect } from "vitest";
import { Version } from "../version.js";
import { Constraints } from "../constraints.js";
import { constraintTests } from "./test-data/constraints.js";
import { constraintPrereleaseTests } from "./test-data/constraints-prerelease.js";
import {
  wildcardOperatorTests,
  wildcardOperatorPrereleaseTests,
} from "./test-data/constraints-wildcard-operators.js";
import {
  caretHyphenTests,
  caretHyphenPrereleaseTests,
} from "./test-data/constraints-caret-hyphen.js";

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

describe("Constraint checks with an operator in front of a bare wildcard", () => {
  for (const tc of wildcardOperatorTests) {
    const label = `satisfies("${tc.version}", "${tc.constraint}") === ${tc.expected}`;
    it(label, () => {
      const v = Version.parse(tc.version);
      const c = Constraints.parse(tc.constraint);
      expect(c.check(v)).toBe(tc.expected);
    });
  }

  for (const tc of wildcardOperatorPrereleaseTests) {
    const label = `satisfiesWithPrerelease("${tc.version}", "${tc.constraint}") === ${tc.expected}`;
    it(label, () => {
      const v = Version.parse(tc.version);
      const c = Constraints.parse(tc.constraint);
      expect(c.check(v, { includePrerelease: true })).toBe(tc.expected);
    });
  }

  it("names the operator in validation errors", () => {
    const { errors } = Constraints.parse(">*").validate(Version.parse("0.0.0"));
    expect(errors).toEqual(["0.0.0 does not satisfy >*"]);
  });
});

describe("Constraint checks of wildcard carets and wildcard hyphen ranges", () => {
  for (const tc of caretHyphenTests) {
    const label = `satisfies("${tc.version}", "${tc.constraint}") === ${tc.expected}`;
    it(label, () => {
      const v = Version.parse(tc.version);
      const c = Constraints.parse(tc.constraint);
      expect(c.check(v)).toBe(tc.expected);
    });
  }

  for (const tc of caretHyphenPrereleaseTests) {
    const label = `satisfiesWithPrerelease("${tc.version}", "${tc.constraint}") === ${tc.expected}`;
    it(label, () => {
      const v = Version.parse(tc.version);
      const c = Constraints.parse(tc.constraint);
      expect(c.check(v, { includePrerelease: true })).toBe(tc.expected);
    });
  }
});
