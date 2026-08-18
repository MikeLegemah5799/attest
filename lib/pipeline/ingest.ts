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
export async function ingest(_input: IngestInput): Promise<IngestResult> {
  throw new Error("not implemented");
}
