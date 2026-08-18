import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db/client";
import { getDocumentBySlug, insertDocument } from "@/lib/db/queries/documents";
import { insertExtractions, type NewExtraction } from "@/lib/db/queries/extractions";
import { documents, derivedDates, extractions, riskFlags } from "@/lib/db/schema";

import { derive } from "./derive";

const testSlug = "test-derive-fake-lease";

function deleteTestDocument() {
  const existing = getDocumentBySlug(testSlug);
  if (!existing) return;
  db.delete(derivedDates).where(eq(derivedDates.documentId, existing.id)).run();
  db.delete(riskFlags).where(eq(riskFlags.documentId, existing.id)).run();
  db.delete(extractions).where(eq(extractions.documentId, existing.id)).run();
  db.delete(documents).where(eq(documents.id, existing.id)).run();
}

describe("derive (real db, wires lib/dates/ to persisted extractions)", () => {
  let documentId: string;
  const runId = "run-1";

  beforeAll(() => {
    deleteTestDocument();
    const doc = insertDocument({
      id: crypto.randomUUID(),
      slug: testSlug,
      filename: "fake-lease.pdf",
      title: "Test fixture — fake lease",
    });
    documentId = doc.id;

    const fields: NewExtraction[] = [
      {
        documentId,
        runId,
        promptVersion: "v1",
        fieldGroup: "term",
        fieldKey: "commencement_date",
        label: "Commencement Date",
        value: "January 1, 2024",
        evidenceText: "Commencement Date: January 1, 2024",
        pageNumber: 2,
        boundingBox: null,
        confidence: 0.95,
        groundingStatus: "grounded",
        verifierStatus: "confirmed",
        status: "grounded",
      },
      {
        documentId,
        runId,
        promptVersion: "v1",
        fieldGroup: "term",
        fieldKey: "expiration_date",
        label: "Expiration Date",
        value: "December 31, 2029",
        evidenceText: "Expiration Date: December 31, 2029",
        pageNumber: 2,
        boundingBox: null,
        confidence: 0.95,
        groundingStatus: "grounded",
        verifierStatus: "confirmed",
        status: "grounded",
      },
      {
        documentId,
        runId,
        promptVersion: "v1",
        fieldGroup: "risk_clauses",
        fieldKey: "early_termination_right",
        label: "Early Termination Right",
        value: "Yes, on casualty",
        evidenceText: "Landlord may terminate on casualty",
        pageNumber: 22,
        boundingBox: null,
        confidence: 0.9,
        groundingStatus: "grounded",
        verifierStatus: "confirmed",
        status: "grounded",
      },
    ];
    insertExtractions(fields);
  });

  afterAll(() => {
    deleteTestDocument();
  });

  it("persists derived dates and risk flags computed from this run's extractions", async () => {
    const result = await derive({ documentId, runId });

    expect(result.dates.map((d) => d.dateType).sort()).toEqual(
      ["commencement", "expiration", "next_escalation", "renewal_notice_deadline"].sort(),
    );
    const expiration = result.dates.find((d) => d.dateType === "expiration")!;
    expect(expiration.value).toBe("2029-12-31");
    expect(expiration.status).toBe("computed");

    expect(result.riskFlags).toHaveLength(4);
    const earlyTermination = result.riskFlags.find((f) => f.flagType === "early_termination")!;
    expect(earlyTermination.present).toBe(true);
    const coTenancy = result.riskFlags.find((f) => f.flagType === "co_tenancy")!;
    expect(coTenancy.present).toBe(false);
    expect(coTenancy.status).toBe("blocked");

    const updatedDoc = getDocumentBySlug(testSlug)!;
    expect(updatedDoc.status).toBe("derived");

    // Rows actually landed in the DB, not just returned in memory.
    const dateRows = db
      .select()
      .from(derivedDates)
      .where(eq(derivedDates.documentId, documentId))
      .all();
    expect(dateRows).toHaveLength(4);
    const flagRows = db.select().from(riskFlags).where(eq(riskFlags.documentId, documentId)).all();
    expect(flagRows).toHaveLength(4);
  });
});
