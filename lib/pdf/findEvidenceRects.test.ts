import { describe, expect, it } from "vitest";

import { findEvidenceRects } from "./index";
import type { PdfTextItem } from "./types";

function item(text: string, x: number, y: number, overrides: Partial<PdfTextItem> = {}): PdfTextItem {
  return { text, x, y, width: text.length * 6, height: 10, hasEOL: false, ...overrides };
}

describe("findEvidenceRects", () => {
  it("returns an empty array when the evidence text is not on the page", () => {
    const items = [item("The quick brown fox", 0, 0)];
    expect(findEvidenceRects(items, "jumps over the lazy dog")).toEqual([]);
  });

  it("returns an empty array for blank evidence text", () => {
    const items = [item("The quick brown fox", 0, 0)];
    expect(findEvidenceRects(items, "   ")).toEqual([]);
  });

  it("matches a run spanning multiple items on one line and merges their boxes", () => {
    const items = [
      item("Tenant shall pay ", 0, 100),
      item("Base Rent", 102, 100, { width: 60 }),
      item(" monthly.", 162, 100),
    ];
    const rects = findEvidenceRects(items, "Tenant shall pay Base Rent monthly.");
    expect(rects).toHaveLength(1);
    expect(rects[0]).toEqual({ x: 0, y: 100, width: 216, height: 10 });
  });

  it("tolerates whitespace differences between quoted evidence and page text", () => {
    const items = [item("Tenant  shall   pay", 0, 0)];
    const rects = findEvidenceRects(items, "Tenant shall pay");
    expect(rects).toHaveLength(1);
  });

  it("is case-sensitive, matching the grounding invariant's exactness", () => {
    const items = [item("LANDLORD shall provide notice", 0, 0)];
    expect(findEvidenceRects(items, "landlord shall provide notice")).toEqual([]);
  });

  it("produces one merged rect per line when evidence spans a line wrap", () => {
    // Top-left origin, y-down (lib/types.ts BoundingBox convention) — the
    // first visual line has the smaller y.
    const items = [
      item("this lease is intended as a quick reference", 0, 88, { hasEOL: true }),
      item("to specific provisions of the agreement", 0, 100),
    ];
    const rects = findEvidenceRects(
      items,
      "this lease is intended as a quick reference to specific provisions",
    );
    expect(rects).toHaveLength(2);
    expect(rects[0].y).toBe(88);
    expect(rects[1].y).toBe(100);
  });
});
