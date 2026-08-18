import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { pages } from "@/lib/db/schema";

export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;

export function insertPages(rows: NewPage[]): Page[] {
  if (rows.length === 0) return [];
  return db.insert(pages).values(rows).returning().all();
}

export function listPagesForDocument(documentId: string): Page[] {
  return db.select().from(pages).where(eq(pages.documentId, documentId)).all();
}

export function getPage(documentId: string, pageNumber: number): Page | undefined {
  return db
    .select()
    .from(pages)
    .where(and(eq(pages.documentId, documentId), eq(pages.pageNumber, pageNumber)))
    .get();
}
