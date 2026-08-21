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
      // Doesn't match on the first number it can find inside a sentence
      // that also states a different amount ($240,000) — it only matches
      // here because the shorter value's exact text is fully contained in
      // the longer one (the containment fallback below), not because the
      // numbers alone were compared.
      expect(
        fieldsMatch("$240,000.00 per annum ($20,000.00 per month)", "$20,000.00 per month"),
      ).toBe(true);
      // A genuinely different amount embedded in a longer sentence must not match.
      expect(
        fieldsMatch("$240,000.00 per annum ($20,000.00 per month)", "$25,000.00 per month"),
      ).toBe(false);
    });
  });

  describe("containment", () => {
    it("matches when one value is the other plus extra elaboration", () => {
      expect(
        fieldsMatch(
          "Southpark Corporate Center, L.L.C.",
          "Southpark Corporate Center, L.L.C., a Delaware limited liability company",
        ),
      ).toBe(true);
      expect(
        fieldsMatch(
          "annual Base Rent increases to 102.5% of the prior Lease Year's Base Rent.",
          "annual Base Rent increases to 102.5% of the prior Lease Year's Base Rent (2.5% annual increase)",
        ),
      ).toBe(true);
    });

    it("does not let a short, generic value match by coincidental substring", () => {
      expect(fieldsMatch("yes", "definitely not — the answer is no")).toBe(false);
    });

    it("matches a short but specific two-word value, not just long ones", () => {
      expect(fieldsMatch("E-Loan, Inc.", "E-Loan, Inc., a Delaware corporation")).toBe(true);
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
