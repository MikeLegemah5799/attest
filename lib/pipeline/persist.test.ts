import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "@/lib/db/client";
import { getDocumentBySlug, insertDocument } from "@/lib/db/queries/documents";
import { listExtractionsForRun } from "@/lib/db/queries/extractions";
import { documents, extractions } from "@/lib/db/schema";

import { persist } from "./persist";
import type { VerifiedField } from "./types";

const testSlug = "test-persist-fake-lease";

function deleteTestDocument() {
  const existing = getDocumentBySlug(testSlug);
  if (!existing) return;
  db.delete(extractions).where(eq(extractions.documentId, existing.id)).run();
  db.delete(documents).where(eq(documents.id, existing.id)).run();
}

describe("persist (real db, no LLM)", () => {
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
  });

  afterAll(() => {
    deleteTestDocument();
  });

  it("writes verified fields as immutable rows and marks the document verified", async () => {
    const fields: VerifiedField[] = [
      {
        fieldGroup: "term",
        fieldKey: "commencement_date",
        label: "Commencement Date",
        value: "January 1, 2024",
        evidenceText: "Commencement Date: January 1, 2024",
        pageNumber: 2,
        confidence: 0.95,
        boundingBox: { x: 10, y: 20, width: 100, height: 12 },
        groundingStatus: "grounded",
        verifierStatus: "confirmed",
        status: "grounded",
      },
      {
        fieldGroup: "risk_clauses",
        fieldKey: "early_termination_right",
        label: "Early Termination Right",
        value: "not found",
        evidenceText: "some quote",
        pageNumber: 5,
        confidence: 0.3,
        boundingBox: null,
        groundingStatus: "grounded",
        verifierStatus: "confirmed",
        status: "review",
      },
    ];

    const result = await persist({ documentId, runId: "run-1", promptVersion: "v1", fields });

    expect(result).toHaveLength(2);
    expect(result[0].id).toBeTruthy();
    expect(result[0].runId).toBe("run-1");
    expect(result[0].promptVersion).toBe("v1");

    const rows = listExtractionsForRun(documentId, "run-1");
    expect(rows).toHaveLength(2);
    const commencement = rows.find((r) => r.fieldKey === "commencement_date")!;
    expect(commencement.status).toBe("grounded");
    expect(commencement.boundingBox).toEqual({ x: 10, y: 20, width: 100, height: 12 });
    const earlyTermination = rows.find((r) => r.fieldKey === "early_termination_right")!;
    expect(earlyTermination.status).toBe("review");
    expect(earlyTermination.boundingBox).toBeNull();

    const updatedDoc = getDocumentBySlug(testSlug)!;
    expect(updatedDoc.status).toBe("verified");
  });

  it("re-running for a new runId adds new rows instead of overwriting the old ones (invariant 4)", async () => {
    const fields: VerifiedField[] = [
      {
        fieldGroup: "term",
        fieldKey: "commencement_date",
        label: "Commencement Date",
        value: "corrected value",
        evidenceText: "Commencement Date: January 1, 2024",
        pageNumber: 2,
        confidence: 0.95,
        boundingBox: null,
        groundingStatus: "grounded",
        verifierStatus: "confirmed",
        status: "grounded",
      },
    ];

    await persist({ documentId, runId: "run-2", promptVersion: "v2", fields });

    const run1Rows = listExtractionsForRun(documentId, "run-1");
    const run2Rows = listExtractionsForRun(documentId, "run-2");
    expect(run1Rows).toHaveLength(2);
    expect(run2Rows).toHaveLength(1);
    expect(run1Rows.find((r) => r.fieldKey === "commencement_date")!.value).toBe(
      "January 1, 2024",
    );
    expect(run2Rows[0].value).toBe("corrected value");
  });
});
