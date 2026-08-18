import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

import { getDocument, type PageViewport, type PDFDocumentProxy } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { TextItem } from "pdfjs-dist/types/src/display/api";

import type { BoundingBox } from "@/lib/types";
import type { PdfHandle, PdfPageText, PdfTextItem } from "./types";

export type { PdfHandle, PdfPageText, PdfTextItem };

/**
 * Typed wrapper around pdfjs-dist (code-standards.md — no implicit `any`
 * from pdfjs-dist's untyped-in-practice API surface across the codebase;
 * everything outside lib/pdf/ talks to these types only).
 *
 * Runs against pdfjs-dist's Node ("legacy") build, not the browser build the
 * PDF viewer will eventually use client-side. pdfjs-dist isn't in Next 16's
 * default `serverExternalPackages` list (unlike better-sqlite3/canvas, which
 * are) — see next.config.ts, which adds it explicitly so App Router doesn't
 * try to bundle its Node-specific `fs`/`process.getBuiltinModule` calls.
 */

const require = createRequire(import.meta.url);
const pdfjsDistRoot = path.dirname(require.resolve("pdfjs-dist/package.json"));
// pdf.js resolves these by reading the path directly (fs.readFile), not as a
// URL — see NodeBinaryDataFactory in pdfjs-dist's legacy build.
const standardFontDataUrl = path.join(pdfjsDistRoot, "standard_fonts") + path.sep;
const cMapUrl = path.join(pdfjsDistRoot, "cmaps") + path.sep;

// PdfHandle is deliberately opaque outside lib/pdf/ (see types.ts) — the
// real pdfjs document proxy is tracked here by handle identity instead of
// being a field on the public type, so no pdfjs-dist type ever needs to
// leak into ingest.ts or beyond.
const openDocuments = new WeakMap<PdfHandle, PDFDocumentProxy>();

export async function loadPdf(filePath: string): Promise<PdfHandle> {
  const data = await readFile(filePath);
  const doc = await getDocument({
    data: new Uint8Array(data),
    standardFontDataUrl,
    cMapUrl,
    cMapPacked: true,
  }).promise;

  const handle: PdfHandle = { filePath, pageCount: doc.numPages };
  openDocuments.set(handle, doc);
  return handle;
}

function getOpenDocument(handle: PdfHandle): PDFDocumentProxy {
  const doc = openDocuments.get(handle);
  if (!doc) {
    throw new Error(`PdfHandle for "${handle.filePath}" was not created by loadPdf()`);
  }
  return doc;
}

export async function getPageText(handle: PdfHandle, pageNumber: number): Promise<PdfPageText> {
  const doc = getOpenDocument(handle);
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  const content = await page.getTextContent();

  const items: PdfTextItem[] = [];
  let text = "";
  for (const raw of content.items) {
    if (!("str" in raw)) continue; // TextMarkedContent, not a text run
    const item = raw as TextItem;
    text += item.str;
    if (item.hasEOL) text += "\n";
    if (!item.str) continue;
    items.push({ text: item.str, hasEOL: item.hasEOL, ...itemBoundingBox(item, viewport) });
  }

  return { pageNumber, text, items };
}

function itemBoundingBox(item: TextItem, viewport: PageViewport): BoundingBox {
  // pdf.js frequently reports `height: 0` on TextItem for horizontal text —
  // the font size lives in the transform matrix's vertical-scale component,
  // not the height field, so fall back to that when height isn't usable.
  const height = item.height || Math.hypot(item.transform[2], item.transform[3]);
  const [x0, y0] = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
  const [x1, y1] = viewport.convertToViewportPoint(
    item.transform[4] + item.width,
    item.transform[5] + height,
  );
  return {
    x: Math.min(x0, x1),
    y: Math.min(y0, y1),
    width: Math.abs(x1 - x0),
    height: Math.abs(y1 - y0),
  };
}

/**
 * Locates verbatim evidence text within a page's positioned text items and
 * returns the bounding box(es) to highlight. Used both for source-span
 * highlighting and as the grounding check (invariant 1) — evidence that
 * doesn't match returns an empty array, which the verify stage treats as
 * ungrounded.
 *
 * Matching is exact on characters and case, but tolerant of whitespace
 * differences between how the model quoted evidence and how pdf.js joined
 * text runs (extra/missing spaces at run and line boundaries are common and
 * not a grounding failure). Known limitation: a word hyphenated across a
 * line wrap in the source PDF won't match evidence text that spells the
 * word without the break, since pdf.js reports the hyphen as a normal
 * character with no dehyphenation signal.
 */
export function findEvidenceRects(items: PdfTextItem[], evidenceText: string): BoundingBox[] {
  const pattern = buildEvidencePattern(evidenceText);
  if (!pattern) return [];

  let haystack = "";
  const itemIndexByChar: number[] = [];
  items.forEach((item, itemIndex) => {
    for (let i = 0; i < item.text.length; i++) itemIndexByChar.push(itemIndex);
    haystack += item.text;
    if (item.hasEOL) {
      haystack += "\n";
      itemIndexByChar.push(itemIndex);
    }
  });

  const match = pattern.exec(haystack);
  if (!match) return [];

  const matchStart = match.index;
  const matchEnd = matchStart + match[0].length;
  const matchedItemIndexes = new Set<number>();
  for (let i = matchStart; i < matchEnd; i++) {
    matchedItemIndexes.add(itemIndexByChar[i]);
  }

  const matchedItems = items.filter((_, idx) => matchedItemIndexes.has(idx));
  return mergeIntoLineRects(matchedItems);
}

/** Builds a regex matching `evidenceText` verbatim except that any run of
 * whitespace in it matches any run of whitespace in the source. */
function buildEvidencePattern(evidenceText: string): RegExp | null {
  const trimmed = evidenceText.trim();
  if (!trimmed) return null;
  const pattern = trimmed
    .split(/\s+/)
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s+");
  return new RegExp(pattern);
}

/** Groups matched items into one merged rect per visual line, top to bottom. */
function mergeIntoLineRects(items: PdfTextItem[]): BoundingBox[] {
  if (items.length === 0) return [];

  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const lines: PdfTextItem[][] = [];

  for (const item of sorted) {
    const currentLine = lines.at(-1);
    const sameLine =
      currentLine &&
      Math.abs(item.y - currentLine[0].y) < Math.max(item.height, currentLine[0].height) / 2;
    if (sameLine) {
      currentLine.push(item);
    } else {
      lines.push([item]);
    }
  }

  return lines.map((line) => {
    const x0 = Math.min(...line.map((i) => i.x));
    const y0 = Math.min(...line.map((i) => i.y));
    const x1 = Math.max(...line.map((i) => i.x + i.width));
    const y1 = Math.max(...line.map((i) => i.y + i.height));
    return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
  });
}
