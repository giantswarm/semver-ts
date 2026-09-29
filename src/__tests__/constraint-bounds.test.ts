import { describe, it, expect } from "vitest";
import { Version } from "../version.js";
import { Constraints } from "../constraints.js";
import { constraintTests } from "./test-data/constraints.js";

describe("Constraints.minVersion", () => {
  const cases: Array<[string, string | null]> = [
    ["*", "0.0.0"],
    ["", "0.0.0"],
    ["1.2.3", "1.2.3"],
    ["=1.2.3", "1.2.3"],
    [">=1.2.3", "1.2.3"],
    [">1.2.3", "1.2.4"],
    [">1.2", "1.3.0"],
    [">1.x", "2.0.0"],
    [">1.2.3-rc.1", "1.2.3-rc.1.0"],
    ["~1.2.3", "1.2.3"],
    ["~1.2", "1.2.0"],
    ["^1.2.3", "1.2.3"],
    ["^0.2.3", "0.2.3"],
    ["1.x", "1.0.0"],
    ["1.2.x", "1.2.0"],
    ["<2.0.0", "0.0.0"],
    ["<=1.2.3", "0.0.0"],
    [">=1.2.3 <2.0.0", "1.2.3"],
    [">=1.2.0, <1.3.0", "1.2.0"],
    ["1.2.3 - 1.4.0", "1.2.3"],
    ["^1.2.3 || ^0.5.0", "0.5.0"],
    [">=1.0.0-rc.1", "1.0.0-rc.1"],
    ["<0.0.0", null],
    [">=1.2.3 <1.0.0", null],
    [">=1.2.3 !=1.2.3", null],
  ];

  for (const [constraint, expected] of cases) {
    it(`minVersion("${constraint}") === ${expected}`, () => {
      const min = Constraints.parse(constraint).minVersion();
      expect(min?.toString() ?? null).toBe(expected);
    });
  }

  it("returns a version the constraint admits, for every constraint in the Masterminds test data", () => {
    const constraints = new Set(constraintTests.map((tc) => tc.constraint));
    for (const constraint of constraints) {
      const c = Constraints.tryParse(constraint);
      const min = c?.minVersion();
      if (c && min) {
        expect(c.check(min), `${constraint} → ${min.toString()}`).toBe(true);
      }
    }
  });
});

describe("Constraints.maxSatisfying", () => {
  const versions = [
    "1.0.0",
    "1.2.0",
    "1.2.5",
    "1.3.0-rc.1",
    "1.3.0",
    "2.0.0",
    "2.1.0-rc.1",
  ].map((v) => Version.parse(v));

  const cases: Array<[string, string | null]> = [
    ["*", "2.0.0"],
    ["~1.2.0", "1.2.5"],
    ["^1.0.0", "1.3.0"],
    [">=1.0.0 <1.3.0", "1.2.5"],
    [">=2.1.0-0", "2.1.0-rc.1"],
    ["^3.0.0", null],
  ];

  for (const [constraint, expected] of cases) {
    it(`maxSatisfying(…, "${constraint}") === ${expected}`, () => {
      const max = Constraints.parse(constraint).maxSatisfying(versions);
      expect(max?.toString() ?? null).toBe(expected);
    });
  }

  it("admits pre-releases with includePrerelease", () => {
    expect(
      Constraints.parse("*")
        .maxSatisfying(versions, { includePrerelease: true })
        ?.toString(),
    ).toBe("2.1.0-rc.1");
  });

  it("returns null for no versions", () => {
    expect(Constraints.parse("*").maxSatisfying([])).toBeNull();
  });
});
