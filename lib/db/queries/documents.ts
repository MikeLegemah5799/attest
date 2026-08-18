import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { documents } from "@/lib/db/schema";

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

export function listDocuments(): Document[] {
  return db.select().from(documents).all();
}

export function getDocumentBySlug(slug: string): Document | undefined {
  return db.select().from(documents).where(eq(documents.slug, slug)).get();
}

export function insertDocument(doc: NewDocument): Document {
  return db.insert(documents).values(doc).returning().get();
}

export function updateDocumentStatus(id: string, status: Document["status"]): Document {
  return db
    .update(documents)
    .set({ status })
    .where(eq(documents.id, id))
    .returning()
    .get();
}
