import path from "node:path";

import { describe, expect, it } from "vitest";

import { findEvidenceRects, getPageText, loadPdf } from "./index";

const fixturePath = path.join(
  import.meta.dirname,
  "../../fixtures/leases/eloan-metro-square-jacksonville.pdf",
);

describe("loadPdf + getPageText (against a real fixture)", () => {
  it("loads the fixture and reports its real page count", async () => {
    const handle = await loadPdf(fixturePath);
    expect(handle.filePath).toBe(fixturePath);
    expect(handle.pageCount).toBe(52);
  });

  it("extracts real text and positioned items from page 1", async () => {
    const handle = await loadPdf(fixturePath);
    const page = await getPageText(handle, 1);

    expect(page.pageNumber).toBe(1);
    expect(page.text).toContain("OFFICE LEASE AGREEMENT");
    expect(page.items.length).toBeGreaterThan(0);
    for (const item of page.items) {
      expect(item.text.length).toBeGreaterThan(0);
      expect(item.width).toBeGreaterThan(0);
      expect(item.height).toBeGreaterThan(0);
    }
  });

  it("throws for a page number that doesn't exist", async () => {
    const handle = await loadPdf(fixturePath);
    await expect(getPageText(handle, 9999)).rejects.toThrow();
  });

  it("grounds real evidence text against page 1's positioned items", async () => {
    const handle = await loadPdf(fixturePath);
    const page = await getPageText(handle, 1);

    const rects = findEvidenceRects(page.items, "OFFICE LEASE AGREEMENT");
    expect(rects.length).toBeGreaterThan(0);

    const ungrounded = findEvidenceRects(page.items, "this text does not appear on the page");
    expect(ungrounded).toEqual([]);
  });
});
