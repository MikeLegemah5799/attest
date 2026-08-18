import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db/client";
import { insertDerivedDates, type NewDerivedDate } from "@/lib/db/queries/derivedDates";
import { getDocumentBySlug, insertDocument } from "@/lib/db/queries/documents";
import { insertExtractions, type NewExtraction } from "@/lib/db/queries/extractions";
import { insertGoldLabels, type NewGoldLabel } from "@/lib/db/queries/goldLabels";
import { derivedDates, documents, evalRuns, extractions, goldLabels } from "@/lib/db/schema";

import { runEval } from "./runner";

const testSlug = "test-eval-fake-lease";

function deleteTestDocument() {
  const existing = getDocumentBySlug(testSlug);
  if (!existing) return;
  db.delete(goldLabels).where(eq(goldLabels.documentId, existing.id)).run();
  db.delete(derivedDates).where(eq(derivedDates.documentId, existing.id)).run();
  db.delete(extractions).where(eq(extractions.documentId, existing.id)).run();
  db.delete(documents).where(eq(documents.id, existing.id)).run();
}

describe("runEval (real db, synthetic gold labels — no real gold-labeled fixtures exist yet)", () => {
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
        confidence: 0.95,
        groundingStatus: "grounded",
        verifierStatus: "confirmed",
        status: "grounded",
      },
      {
        documentId,
        runId: "run-1",
        promptVersion: "v1",
        fieldGroup: "term",
        fieldKey: "commencement_date",
        label: "Commencement Date",
        value: "January 15, 2024",
        evidenceText: "Commencement Date: January 15, 2024",
        pageNumber: 2,
        boundingBox: null,
        confidence: 0.9,
        groundingStatus: "grounded",
        verifierStatus: "confirmed",
        status: "grounded",
      },
      {
        documentId,
        runId: "run-1",
        promptVersion: "v1",
        fieldGroup: "term",
        fieldKey: "expiration_date",
        label: "Expiration Date",
        value: "December 31, 2028",
        evidenceText: "Expiration Date: December 31, 2028",
        pageNumber: 2,
        boundingBox: null,
        confidence: 0.9,
        groundingStatus: "grounded",
        verifierStatus: "confirmed",
        status: "grounded",
      },
      // tenant_name deliberately not extracted, to test the "gold exists,
      // prediction missing" path counts as incorrect, not skipped.
    ];
    insertExtractions(fields);

    const dates: NewDerivedDate[] = [
      {
        documentId,
        runId: "run-1",
        dateType: "expiration",
        label: "Expiration Date",
        value: "2029-12-31",
        status: "computed",
        reason: null,
        sourceFieldKeys: ["expiration_date"],
      },
    ];
    insertDerivedDates(dates);

    // Gold labels are deliberately NOT inserted here — the real dev db may
    // already have real gold data (fixtures/gold/*.json) that also scores,
    // so each test below measures its own contribution as a delta against
    // a freshly-computed baseline instead of asserting exact totals.
  });

  afterAll(() => {
    deleteTestDocument();
    db.delete(evalRuns).run();
  });

  it("scores field and date accuracy separately, treating a missing prediction as incorrect", async () => {
    const baseline = await runEval("baseline");

    const gold: NewGoldLabel[] = [
      { documentId, fieldKey: "landlord_name", expectedValue: "Acme Properties LLC", notes: null },
      { documentId, fieldKey: "tenant_name", expectedValue: "Foo Corp", notes: null },
      { documentId, fieldKey: "commencement_date", expectedValue: "2024-01-15", notes: null },
      { documentId, fieldKey: "expiration_date", expectedValue: "December 31, 2029", notes: null }, // extracted value is a year off — wrong
      { documentId, fieldKey: "expiration", expectedValue: "2029-12-31", notes: null }, // derived date, exact match
    ];
    insertGoldLabels(gold);

    const run = await runEval("test-version");

    expect(run.promptVersion).toBe("test-version");
    expect(run.finishedAt).not.toBeNull();

    const runFields = run.fieldAccuracy!;
    const baselineFields = baseline.fieldAccuracy!;
    const runDates = run.dateAccuracy!;
    const baselineDates = baseline.dateAccuracy!;

    // Field accuracy: landlord_name correct (exact), tenant_name incorrect
    // (never extracted), commencement_date correct (date-format-tolerant
    // match), expiration_date incorrect (extracted, but the wrong year) —
    // the derived "expiration" date-type gold label is scored separately,
    // not counted here. Measured as a delta against the baseline so this
    // test is robust to whatever other real gold-labeled documents already
    // exist in the shared dev db.
    expect(runFields.totalFields - baselineFields.totalFields).toBe(4);
    expect(runFields.correctFields - baselineFields.correctFields).toBe(2);
    for (const group of ["parties_premises", "term"] as const) {
      const before = baselineFields.byFieldGroup[group] ?? { total: 0, correct: 0 };
      const after = runFields.byFieldGroup[group]!;
      expect(after.total - before.total).toBe(2);
      expect(after.correct - before.correct).toBe(1);
    }

    // Date accuracy: only the "expiration" gold label is a derived date type.
    expect(runDates.totalDates - baselineDates.totalDates).toBe(1);
    expect(runDates.correctDates - baselineDates.correctDates).toBe(1);
  });

  it("throws on a gold label with an unrecognized fieldKey rather than silently ignoring it", async () => {
    insertGoldLabels([{ documentId, fieldKey: "not_a_real_field", expectedValue: "x", notes: null }]);
    await expect(runEval("test-version")).rejects.toThrow(/unrecognized fieldKey/);
  });
});
