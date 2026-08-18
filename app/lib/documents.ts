import { getDocumentBySlug, listDocuments } from "@/lib/db/queries/documents";
import { surfacePrep, type SurfacePrepResult } from "@/lib/pipeline/surfacePrep";
import type { FieldGroup } from "@/lib/types";

export type DocumentSummary = {
  slug: string;
  title: string;
  type: string;
  verifiedFilled: number;
  verifiedTotal: number;
  verifiedPercent: number;
  flags: number;
  expires: string;
};

export const FIELD_GROUP_LABELS: Record<FieldGroup, string> = {
  parties_premises: "Parties & Premises",
  term: "Term",
  rent_escalation: "Rent & Escalation",
  options_notice: "Options & Notice",
  expenses: "Expenses",
  risk_clauses: "Risk Clauses",
};

/** Every document is an office lease — project-overview.md scopes out other lease types. */
const DOCUMENT_TYPE = "Office";

export function verificationStats(trackerCategories: SurfacePrepResult["trackerCategories"]) {
  const filled = trackerCategories.reduce((sum, c) => sum + c.grounded, 0);
  const total = trackerCategories.reduce((sum, c) => sum + c.total, 0);
  const percent = total === 0 ? 0 : Math.round((filled / total) * 100);
  return { filled, total, percent };
}

export function formatExpires(criticalDates: SurfacePrepResult["criticalDates"]): string {
  const expiration = criticalDates.find((d) => d.dateType === "expiration");
  if (!expiration?.value) return "—";
  return new Date(expiration.value).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function summarize(doc: { slug: string; title: string }, result: SurfacePrepResult): DocumentSummary {
  const { filled, total, percent } = verificationStats(result.trackerCategories);
  return {
    slug: doc.slug,
    title: doc.title,
    type: DOCUMENT_TYPE,
    verifiedFilled: filled,
    verifiedTotal: total,
    verifiedPercent: percent,
    flags: result.riskFlags.filter((f) => f.present).length,
    expires: formatExpires(result.criticalDates),
  };
}

/** Every seeded document's summary row, for the documents list screen. */
export async function listDocumentSummaries(): Promise<DocumentSummary[]> {
  const docs = listDocuments();
  return Promise.all(docs.map(async (doc) => summarize(doc, await surfacePrep({ documentId: doc.id }))));
}

/**
 * A document plus its latest run's surfaced data, for the three per-document
 * review screens — one call gets everything those pages need, including the
 * same summary shape (verified counts, flags, expires) the topbar renders.
 */
export async function getDocumentDetail(
  slug: string,
): Promise<{
  documentId: string;
  summary: DocumentSummary;
  result: SurfacePrepResult;
  pageCount: number;
} | null> {
  const doc = getDocumentBySlug(slug);
  if (!doc) return null;
  const result = await surfacePrep({ documentId: doc.id });
  return { documentId: doc.id, summary: summarize(doc, result), result, pageCount: doc.pageCount ?? 0 };
}
