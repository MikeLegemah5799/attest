import { readFile, rm } from "node:fs/promises";
import path from "node:path";

import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db/client";
import { getDocumentBySlug, insertDocument } from "@/lib/db/queries/documents";
import { listPagesForDocument } from "@/lib/db/queries/pages";
import { documents, pages } from "@/lib/db/schema";

import { ingest } from "./ingest";

const fixturePath = path.join(
  import.meta.dirname,
  "../../fixtures/leases/eloan-metro-square-jacksonville.pdf",
);
const testSlug = "test-ingest-eloan-metro-square";
const cacheDir = path.join(process.env.PAGE_TEXT_CACHE_DIR ?? "./cache/pages");

function deleteTestDocument() {
  const existing = getDocumentBySlug(testSlug);
  if (!existing) return;
  db.delete(pages).where(eq(pages.documentId, existing.id)).run();
  db.delete(documents).where(eq(documents.id, existing.id)).run();
}

describe("ingest (against a real fixture and the real db)", () => {
  let documentId: string;

  beforeAll(() => {
    deleteTestDocument();
    const doc = insertDocument({
      id: crypto.randomUUID(),
      slug: testSlug,
      filename: path.basename(fixturePath),
      title: "Test fixture — E-Loan Metro Square",
    });
    documentId = doc.id;
  });

  afterAll(async () => {
    deleteTestDocument();
    await rm(path.join(cacheDir, documentId), { recursive: true, force: true });
  });

  it("ingests all 52 pages, caches each page's text, and marks the document ingested", async () => {
    const result = await ingest({ documentId, filePath: fixturePath });
    expect(result).toEqual({ documentId, pageCount: 52 });

    const pageRows = listPagesForDocument(documentId);
    expect(pageRows).toHaveLength(52);
    expect(pageRows.map((p) => p.pageNumber).sort((a, b) => a - b)).toEqual(
      Array.from({ length: 52 }, (_, i) => i + 1),
    );
    for (const row of pageRows) {
      expect(row.charCount).toBeGreaterThan(0);
    }

    const page1 = pageRows.find((p) => p.pageNumber === 1)!;
    const page1Text = await readFile(page1.textCachePath, "utf-8");
    expect(page1Text).toContain("OFFICE LEASE AGREEMENT");

    const updatedDoc = getDocumentBySlug(testSlug)!;
    expect(updatedDoc.status).toBe("ingested");
    expect(updatedDoc.pageCount).toBe(52);
  });
});
