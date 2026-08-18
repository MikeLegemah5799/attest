import type { BoundingBox } from "@/lib/types";
import type { PdfHandle, PdfPageText, PdfTextItem } from "./types";

export type { PdfHandle, PdfPageText, PdfTextItem };

/**
 * Typed wrapper around pdfjs-dist (code-standards.md — no implicit `any`
 * from pdfjs-dist's untyped-in-practice API surface across the codebase;
 * everything outside lib/pdf/ talks to these types only).
 *
 * Wired up as its own increment once ingest starts (progress-tracker.md
 * Next Up #4) — pdfjs-dist runs against Node's legacy build here, not the
 * browser build the PDF viewer will eventually use client-side.
 */

export async function loadPdf(_filePath: string): Promise<PdfHandle> {
  throw new Error("not implemented");
}

export async function getPageText(_handle: PdfHandle, _pageNumber: number): Promise<PdfPageText> {
  throw new Error("not implemented");
}

/**
 * Locates verbatim evidence text within a page's positioned text items and
 * returns the bounding box(es) to highlight. Used both for source-span
 * highlighting and as the grounding check (invariant 1) — evidence that
 * doesn't match returns an empty array, which the verify stage treats as
 * ungrounded.
 */
export function findEvidenceRects(_items: PdfTextItem[], _evidenceText: string): BoundingBox[] {
  throw new Error("not implemented");
}
