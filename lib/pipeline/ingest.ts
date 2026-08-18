import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { markDocumentIngested } from "@/lib/db/queries/documents";
import { insertPages, type NewPage } from "@/lib/db/queries/pages";
import { getPageText, loadPdf } from "@/lib/pdf";

export type IngestInput = {
  documentId: string;
  filePath: string;
};

export type IngestResult = {
  documentId: string;
  pageCount: number;
};

/**
 * Stage 1/6. Loads a fixture PDF via lib/pdf/, caches each page's text to
 * disk, and writes the page text index (lib/db pages table). Owns no Claude
 * calls — that starts at the extract stage.
 */
export async function ingest(input: IngestInput): Promise<IngestResult> {
  const handle = await loadPdf(input.filePath);
  const cacheDir = path.join(process.env.PAGE_TEXT_CACHE_DIR ?? "./cache/pages", input.documentId);
  await mkdir(cacheDir, { recursive: true });

  const pageRows: NewPage[] = [];
  for (let pageNumber = 1; pageNumber <= handle.pageCount; pageNumber++) {
    const page = await getPageText(handle, pageNumber);
    const textCachePath = path.join(cacheDir, `${pageNumber}.txt`);
    await writeFile(textCachePath, page.text, "utf-8");
    pageRows.push({
      documentId: input.documentId,
      pageNumber,
      charCount: page.text.length,
      textCachePath,
    });
  }

  insertPages(pageRows);
  markDocumentIngested(input.documentId, handle.pageCount);

  return { documentId: input.documentId, pageCount: handle.pageCount };
}
