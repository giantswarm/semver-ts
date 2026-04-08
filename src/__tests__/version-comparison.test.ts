import { describe, it, expect } from "vitest";
import { Version } from "../version.js";
import { versionComparisonTests } from "./test-data/version-comparison.js";

describe("Version comparison", () => {
  for (const tc of versionComparisonTests) {
    const label = `compare("${tc.v1}", "${tc.v2}") === ${tc.expected}`;
    it(label, () => {
      const v1 = Version.parse(tc.v1);
      const v2 = Version.parse(tc.v2);
      expect(v1.compare(v2)).toBe(tc.expected);
    });
  }
});
