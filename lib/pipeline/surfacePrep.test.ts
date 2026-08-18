import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db/client";
import { insertDerivedDates, type NewDerivedDate } from "@/lib/db/queries/derivedDates";
import { getDocumentBySlug, insertDocument } from "@/lib/db/queries/documents";
import { insertExtractions, type NewExtraction } from "@/lib/db/queries/extractions";
import { insertRiskFlags, type NewRiskFlag } from "@/lib/db/queries/riskFlags";
import { derivedDates, documents, extractions, riskFlags } from "@/lib/db/schema";

import { surfacePrep } from "./surfacePrep";

const testSlug = "test-surfaceprep-fake-lease";

function deleteTestDocument() {
  const existing = getDocumentBySlug(testSlug);
  if (!existing) return;
  db.delete(derivedDates).where(eq(derivedDates.documentId, existing.id)).run();
  db.delete(riskFlags).where(eq(riskFlags.documentId, existing.id)).run();
  db.delete(extractions).where(eq(extractions.documentId, existing.id)).run();
  db.delete(documents).where(eq(documents.id, existing.id)).run();
}

describe("surfacePrep (real db)", () => {
  let documentId: string;

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
      // Inserted out of canonical field order deliberately, to prove
      // surfacePrep re-sorts rather than trusting insertion/row order.
      {
        documentId,
        runId: "run-1",
        promptVersion: "v1",
        fieldGroup: "parties_premises",
        fieldKey: "tenant_name",
        label: "Tenant",
        value: "Foo Corp",
        evidenceText: "Tenant: Foo Corp",
        pageNumber: 1,
        boundingBox: null,
        confidence: 0.95,
        groundingStatus: "grounded",
        verifierStatus: "confirmed",
        status: "grounded",
      },
      {
        documentId,
        runId: "run-1",
        promptVersion: "v1",
        fieldGroup: "parties_premises",
        fieldKey: "landlord_name",
        label: "Landlord",
        value: "Acme Properties LLC",
        evidenceText: "Landlord: Acme Properties LLC",
        pageNumber: 1,
        boundingBox: null,
        confidence: 0.4,
        groundingStatus: "grounded",
        verifierStatus: "confirmed",
        status: "review",
      },
      {
        documentId,
        runId: "run-1",
        promptVersion: "v1",
        fieldGroup: "risk_clauses",
        fieldKey: "co_tenancy_clause",
        label: "Co-Tenancy Clause",
        value: "no co-tenancy provision found",
        evidenceText: "does not appear",
        pageNumber: 30,
        boundingBox: null,
        confidence: 0.2,
        groundingStatus: "ungrounded",
        verifierStatus: null,
        status: "blocked",
      },
    ];
    insertExtractions(fields);

    const dates: NewDerivedDate[] = [
      {
        documentId,
        runId: "run-1",
        dateType: "next_escalation",
        label: "Next Escalation Date",
        value: null,
        status: "blocked",
        reason: "escalation cadence not recognized as annual",
        sourceFieldKeys: ["commencement_date"],
      },
      {
        documentId,
        runId: "run-1",
        dateType: "commencement",
        label: "Commencement Date",
        value: "2024-01-01",
        status: "computed",
        reason: null,
        sourceFieldKeys: ["commencement_date"],
      },
    ];
    insertDerivedDates(dates);

    const flags: NewRiskFlag[] = [
      {
        documentId,
        runId: "run-1",
        flagType: "percentage_rent",
        label: "Percentage Rent Clause",
        present: false,
        status: "blocked",
        evidenceText: null,
        pageNumber: null,
        sourceFieldKey: "percentage_rent_clause",
      },
      {
        documentId,
        runId: "run-1",
        flagType: "early_termination",
        label: "Early Termination Right",
        present: true,
        status: "grounded",
        evidenceText: "Tenant may terminate on notice",
        pageNumber: 22,
        sourceFieldKey: "early_termination_right",
      },
    ];
    insertRiskFlags(flags);
  });

  afterAll(() => {
    deleteTestDocument();
  });

  it("groups fields by field group, in the six-group canonical order", async () => {
    const result = await surfacePrep({ documentId });

    expect(result.fieldSections.map((s) => s.fieldGroup)).toEqual([
      "parties_premises",
      "term",
      "rent_escalation",
      "options_notice",
      "expenses",
      "risk_clauses",
    ]);

    const parties = result.fieldSections.find((s) => s.fieldGroup === "parties_premises")!;
    // landlord_name before tenant_name — canonical field order, not insertion order.
    expect(parties.fields.map((f) => f.fieldKey)).toEqual(["landlord_name", "tenant_name"]);
  });

  it("counts tracker totals against the full 18-field spec, not just what was extracted", async () => {
    const result = await surfacePrep({ documentId });

    const parties = result.trackerCategories.find((c) => c.fieldGroup === "parties_premises")!;
    expect(parties.total).toBe(4); // all 4 parties_premises fields, only 2 extracted here
    expect(parties.grounded).toBe(1); // tenant_name is grounded; landlord_name is only review

    const riskClauses = result.trackerCategories.find((c) => c.fieldGroup === "risk_clauses")!;
    expect(riskClauses.total).toBe(4);
    expect(riskClauses.grounded).toBe(0); // co_tenancy_clause is blocked, not grounded
  });

  it("puts review and blocked fields in the queue, and grounded fields nowhere near it", async () => {
    const result = await surfacePrep({ documentId });

    expect(result.queueItems.map((f) => f.fieldKey).sort()).toEqual(
      ["landlord_name", "co_tenancy_clause"].sort(),
    );
    expect(result.queueItems.some((f) => f.fieldKey === "tenant_name")).toBe(false);
  });

  it("orders critical dates chronologically regardless of insertion order", async () => {
    const result = await surfacePrep({ documentId });
    expect(result.criticalDates.map((d) => d.dateType)).toEqual(["commencement", "next_escalation"]);
  });

  it("orders risk flags by canonical spec order regardless of insertion order", async () => {
    const result = await surfacePrep({ documentId });
    expect(result.riskFlags.map((f) => f.flagType)).toEqual(["early_termination", "percentage_rent"]);
  });
});
