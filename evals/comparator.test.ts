import { describe, expect, it } from "vitest";

import { fieldsMatch } from "./comparator";

describe("fieldsMatch", () => {
  it("matches identical strings", () => {
    expect(fieldsMatch("Acme Properties LLC", "Acme Properties LLC")).toBe(true);
  });

  it("is case- and whitespace-insensitive for plain text", () => {
    expect(fieldsMatch("Acme Properties LLC", "  acme   properties llc  ")).toBe(true);
  });

  it("rejects genuinely different text", () => {
    expect(fieldsMatch("Acme Properties LLC", "Beta Holdings Inc")).toBe(false);
  });

  describe("dates", () => {
    it("matches the same date across named-month, ISO, and slash formats", () => {
      expect(fieldsMatch("January 1, 2024", "2024-01-01")).toBe(true);
      expect(fieldsMatch("2024-01-01", "01/01/2024")).toBe(true);
      expect(fieldsMatch("January 1, 2024", "01/01/2024")).toBe(true);
      expect(fieldsMatch("Jan 1, 2024", "January 1, 2024")).toBe(true);
    });

    it("rejects different dates even in matching formats", () => {
      expect(fieldsMatch("January 1, 2024", "January 2, 2024")).toBe(false);
      expect(fieldsMatch("2024-01-01", "2025-01-01")).toBe(false);
    });
  });

  describe("numbers", () => {
    it("matches the same amount across currency/comma formatting", () => {
      expect(fieldsMatch("$20,000.00", "20000")).toBe(true);
      expect(fieldsMatch("24,000", "24000")).toBe(true);
      expect(fieldsMatch("$20,000.00 per month", "20000 monthly")).toBe(true);
    });

    it("rejects different amounts", () => {
      expect(fieldsMatch("$20,000.00", "$21,000.00")).toBe(false);
    });

    it("does not treat a long descriptive sentence containing a number as purely numeric", () => {
      // Falls through to text comparison rather than matching on the first
      // number it can find inside an otherwise-different sentence.
      expect(
        fieldsMatch(
          "$240,000.00 per annum ($20,000.00 per month)",
          "$20,000.00 per month",
        ),
      ).toBe(false);
    });
  });

  it("falls back to text comparison when values aren't dates or pure numbers", () => {
    expect(
      fieldsMatch(
        "Net (pass-through) structure: Tenant pays pro rata share",
        "Net (pass-through) structure: Tenant pays pro rata share",
      ),
    ).toBe(true);
    expect(fieldsMatch("gross lease", "NNN lease")).toBe(false);
  });
});
