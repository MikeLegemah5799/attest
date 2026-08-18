import type { BoundingBox } from "@/lib/types";

/** A single positioned text run on a page, as reported by pdf.js. */
export type PdfTextItem = {
  text: string;
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
