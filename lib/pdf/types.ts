import type { BoundingBox } from "@/lib/types";

/** A single positioned text run on a page, as reported by pdf.js. */
export type PdfTextItem = {
  text: string;
  /** True when this run ends a visual line — a word-boundary signal used by
   * findEvidenceRects to decide whether adjacent items need a space between
   * them when reconstructing searchable text. */
  hasEOL: boolean;
} & BoundingBox;

/** A page's text content plus the positioned items used for highlighting. */
export type PdfPageText = {
  pageNumber: number;
  text: string;
  items: PdfTextItem[];
};

/** An opened PDF document, opaque outside lib/pdf/. */
export type PdfHandle = {
  filePath: string;
  pageCount: number;
};
