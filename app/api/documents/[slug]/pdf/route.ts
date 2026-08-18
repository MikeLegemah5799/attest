import { readFile } from "node:fs/promises";
import path from "node:path";

import { getDocumentBySlug } from "@/lib/db/queries/documents";

const FIXTURE_DIR = "fixtures/leases";

/**
 * Streams a seeded lease's source PDF bytes to the client-side PDF viewer.
 * Fixtures live on disk (code-standards.md — "Source PDFs... live on the
 * filesystem, not as blobs in the database"), so this just resolves the
 * document's filename and reads it; no logic beyond that lookup.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/documents/[slug]/pdf">) {
  const { slug } = await ctx.params;
  const doc = getDocumentBySlug(slug);
  if (!doc) {
    return new Response("Document not found", { status: 404 });
  }

  const filePath = path.join(FIXTURE_DIR, doc.filename);
  const bytes = await readFile(filePath);

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${doc.filename}"`,
    },
  });
}
