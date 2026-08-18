import { describe, expect, it } from "vitest";

import type { ExtractionField } from "@/lib/types";

import { deriveRiskFlags } from "./riskFlags";

let counter = 0;

function makeField(overrides: Partial<ExtractionField>): ExtractionField {
  counter += 1;
  return {
    id: `field-${counter}`,
    documentId: "doc-1",
    runId: "run-1",
    promptVersion: "v1",
    fieldGroup: "risk_clauses",
    fieldKey: "some_field",
    label: "Some Field",
    value: "some value",
    evidenceText: "some evidence",
    pageNumber: 7,
    boundingBox: null,
    confidence: 0.9,
    status: "grounded",
    createdAt: new Date(),
    ...overrides,
  };
}

function byType(flags: ReturnType<typeof deriveRiskFlags>, flagType: string) {
  return flags.find((f) => f.flagType === flagType)!;
}

describe("deriveRiskFlags", () => {
  it("returns exactly the four risk_clauses flags, every call", () => {
    const flags = deriveRiskFlags({ documentId: "doc-1", runId: "run-1", extractions: [] });
    expect(flags.map((f) => f.flagType).sort()).toEqual(
      ["assignment_consent", "co_tenancy", "early_termination", "percentage_rent"].sort(),
    );
  });

  it("marks present:true with the source citation for a grounded field", () => {
    const flags = deriveRiskFlags({
      documentId: "doc-1",
      runId: "run-1",
      extractions: [
        makeField({
          fieldKey: "early_termination_right",
          evidenceText: "Landlord may terminate on 60 days notice",
          pageNumber: 22,
          status: "grounded",
        }),
      ],
    });

    const flag = byType(flags, "early_termination");
    expect(flag).toMatchObject({
      present: true,
      status: "grounded",
      evidenceText: "Landlord may terminate on 60 days notice",
      pageNumber: 22,
      sourceFieldKey: "early_termination_right",
    });
  });

  it("carries a review-status field through as present:true, status:review (still needs a human look)", () => {
    const flags = deriveRiskFlags({
      documentId: "doc-1",
      runId: "run-1",
      extractions: [makeField({ fieldKey: "co_tenancy_clause", status: "review" })],
    });

    expect(byType(flags, "co_tenancy")).toMatchObject({ present: true, status: "review" });
  });

  it("blocks a field that failed grounding/verification instead of asserting absence", () => {
    const flags = deriveRiskFlags({
      documentId: "doc-1",
      runId: "run-1",
      extractions: [
        makeField({
          fieldKey: "percentage_rent_clause",
          status: "blocked",
          evidenceText: "some quote that didn't ground",
        }),
      ],
    });

    const flag = byType(flags, "percentage_rent");
    expect(flag.present).toBe(false);
    expect(flag.status).toBe("blocked");
    expect(flag.evidenceText).toBeNull();
    expect(flag.pageNumber).toBeNull();
  });

  it("blocks a field that was never extracted at all — absence of evidence isn't evidence of absence", () => {
    const flags = deriveRiskFlags({ documentId: "doc-1", runId: "run-1", extractions: [] });

    const flag = byType(flags, "assignment_consent");
    expect(flag.present).toBe(false);
    expect(flag.status).toBe("blocked");
    expect(flag.sourceFieldKey).toBe("assignment_subletting_consent");
  });

  it("ignores extraction fields outside the four risk_clauses keys", () => {
    const flags = deriveRiskFlags({
      documentId: "doc-1",
      runId: "run-1",
      extractions: [makeField({ fieldGroup: "term", fieldKey: "commencement_date" })],
    });

    expect(flags).toHaveLength(4);
    expect(flags.every((f) => f.present === false)).toBe(true);
  });
});
