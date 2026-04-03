import { describe, it, expect } from "vitest";
import { Version } from "../version.js";
import {
  strictParsingTests,
  looseParsingTests,
} from "./test-data/version-parsing.js";

describe("Strict version parsing", () => {
  for (const tc of strictParsingTests) {
    const label = `parseStrict("${tc.version}") ${tc.valid ? "succeeds" : "fails"}`;
    it(label, () => {
      if (tc.valid) {
        expect(() => Version.parseStrict(tc.version)).not.toThrow();
      } else {
        expect(() => Version.parseStrict(tc.version)).toThrow();
      }
    });
  }
});

describe("Loose version parsing", () => {
  for (const tc of looseParsingTests) {
    const label = `parse("${tc.version}") ${tc.valid ? "succeeds" : "fails"}`;
    it(label, () => {
      if (tc.valid) {
        expect(() => Version.parse(tc.version)).not.toThrow();
      } else {
        expect(() => Version.parse(tc.version)).toThrow();
      }
    });
  }
});
