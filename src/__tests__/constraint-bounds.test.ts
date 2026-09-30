import { describe, it, expect } from "vitest";
import { Version } from "../version.js";
import { Constraints } from "../constraints.js";
import { constraintTests } from "./test-data/constraints.js";
import { wildcardOperatorTests } from "./test-data/constraints-wildcard-operators.js";
import { caretHyphenTests } from "./test-data/constraints-caret-hyphen.js";

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
    ["1.2.x - 1.4", "1.2.0"],
    ["* - 1.0", "0.0.0"],
    ["^1.2.3 || ^0.5.0", "0.5.0"],
    [">=1.0.0-rc.1", "1.0.0-rc.1"],
    // Exclusions move the minimum up
    ["!=0.0.0", "0.0.1"],
    [">=1.2.3 !=1.2.3", "1.2.4"],
    ["^1.0.0 !=1.0.0 !=1.0.1", "1.0.2"],
    [">=1.0.0 !=1.x", "2.0.0"],
    ["!=1.x", "0.0.0"],
    // Operators in front of a bare wildcard, which stands for 0.0.0
    [">*", "0.0.1"],
    [">=*", "0.0.0"],
    ["<=*", "0.0.0"],
    ["!=*", "0.0.1"],
    ["^*", "0.0.0"],
    [">*-0", "0.0.0-0.0"],
    ["!=*-0", "0.0.0-0.0"],
    // Pre-releases, when the group names one
    [">=0.0.0-0", "0.0.0-0"],
    ["<1.0.0-0", "0.0.0-0"],
    ["<0.0.0-rc", "0.0.0-0"],
    [">1.2.3 <2.0.0-0", "1.2.4-0"],
    [">1.2-rc.1", "1.3.0-0"],
    [">1.x-0", "2.0.0-0"],
    ["^1.2.x-alpha", "1.2.0-alpha"],
    ["^1 <2.0.0-0", "1.0.0"],
    // Nothing satisfies
    ["<0.0.0", null],
    ["<*", null],
    ["<*-0", null],
    ["1.0 - *", null],
    [">=1.2.3 <1.0.0", null],
    ["1.2.3 !=1.2.3", null],
    ["~1.2.3 >=1.3.0", null],
  ];

  for (const [constraint, expected] of cases) {
    it(`minVersion("${constraint}") === ${expected}`, () => {
      const min = Constraints.parse(constraint).minVersion();
      expect(min?.toString() ?? null).toBe(expected);
    });
  }

  it("returns a canonical version", () => {
    const min = Constraints.parse("~1.2").minVersion();
    expect(min?.toOriginalString()).toBe("1.2.0");
    expect(
      Constraints.parse(">=1.2.3+meta").minVersion()?.toOriginalString(),
    ).toBe("1.2.3");
  });

  it("returns the lowest admitted version, for every constraint in the Masterminds test data", () => {
    const satisfying = new Map<string, Version[]>();
    for (const tc of constraintTests) {
      const versions = satisfying.get(tc.constraint) ?? [];
      if (tc.expected) versions.push(Version.parse(tc.version));
      satisfying.set(tc.constraint, versions);
    }

    for (const [constraint, versions] of satisfying) {
      const c = Constraints.tryParse(constraint);
      if (!c) continue;
      const min = c.minVersion();
      if (min) {
        expect(c.check(min), `${constraint} admits ${min}`).toBe(true);
      }
      for (const version of versions) {
        expect(min, `${constraint} admits ${version}`).not.toBeNull();
        expect(min!.lte(version), `${constraint}: ${min} <= ${version}`).toBe(
          true,
        );
      }
    }
  });
});

describe("Constraints.minVersion against a brute-force search", () => {
  // Every version 0..3 . 0..3 . 0..5, each as a release and as pre-releases.
  const grid: Version[] = [];
  for (let major = 0; major <= 3; major++) {
    for (let minor = 0; minor <= 3; minor++) {
      for (let patch = 0; patch <= 5; patch++) {
        for (const pre of ["", "-0", "-alpha", "-rc.1", "-rc.1.0"]) {
          grid.push(Version.parse(`${major}.${minor}.${patch}${pre}`));
        }
      }
    }
  }

  const constraints = new Set(
    [...constraintTests, ...wildcardOperatorTests, ...caretHyphenTests].map(
      (tc) => tc.constraint,
    ),
  );

  for (const constraint of constraints) {
    const c = Constraints.tryParse(constraint);
    if (!c) continue;
    it(`finds nothing below minVersion("${constraint}")`, () => {
      const min = c.minVersion();
      if (min) {
        expect(c.check(min), `${constraint} admits ${min}`).toBe(true);
      }
      const admitted = grid.filter((v) => c.check(v));
      if (admitted.length > 0) {
        expect(min).not.toBeNull();
      }
      for (const version of admitted) {
        expect(min!.lte(version), `${min} <= ${version}`).toBe(true);
      }
    });
  }
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
