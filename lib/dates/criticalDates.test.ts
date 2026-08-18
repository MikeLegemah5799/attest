import { describe, expect, it } from "vitest";

import type { ExtractionField } from "@/lib/types";

import { deriveCriticalDates } from "./criticalDates";

let counter = 0;

function makeField(overrides: Partial<ExtractionField>): ExtractionField {
  counter += 1;
  return {
    id: `field-${counter}`,
    documentId: "doc-1",
    runId: "run-1",
    promptVersion: "v1",
    fieldGroup: "term",
    fieldKey: "some_field",
    label: "Some Field",
    value: "some value",
    evidenceText: "some evidence",
    pageNumber: 1,
    boundingBox: null,
    confidence: 0.9,
    status: "grounded",
    createdAt: new Date(),
    ...overrides,
  };
}

function byType(dates: ReturnType<typeof deriveCriticalDates>, dateType: string) {
  return dates.find((d) => d.dateType === dateType)!;
}

describe("deriveCriticalDates", () => {
  it("passes through a grounded commencement and expiration date, parsed to ISO", () => {
    const result = deriveCriticalDates({
      documentId: "doc-1",
      runId: "run-1",
      extractions: [
        makeField({ fieldKey: "commencement_date", value: "January 1, 2024" }),
        makeField({ fieldKey: "expiration_date", value: "December 31, 2029" }),
      ],
    });

    expect(byType(result, "commencement")).toMatchObject({
      value: "2024-01-01",
      status: "computed",
      reason: null,
    });
    expect(byType(result, "expiration")).toMatchObject({
      value: "2029-12-31",
      status: "computed",
      reason: null,
    });
  });

  it("blocks commencement/expiration when the field wasn't extracted at all", () => {
    const result = deriveCriticalDates({ documentId: "doc-1", runId: "run-1", extractions: [] });

    const commencement = byType(result, "commencement");
    expect(commencement.status).toBe("blocked");
    expect(commencement.value).toBeNull();
    expect(commencement.reason).toMatch(/not extracted or not grounded/);
  });

  it("blocks a date field whose status is review or blocked, not just missing (invariant 2)", () => {
    const result = deriveCriticalDates({
      documentId: "doc-1",
      runId: "run-1",
      extractions: [
        makeField({ fieldKey: "expiration_date", value: "December 31, 2029", status: "review" }),
      ],
    });

    expect(byType(result, "expiration").status).toBe("blocked");
  });

  it("blocks when the extracted value isn't a parseable date", () => {
    const result = deriveCriticalDates({
      documentId: "doc-1",
      runId: "run-1",
      extractions: [makeField({ fieldKey: "expiration_date", value: "sometime next year" })],
    });

    const expiration = byType(result, "expiration");
    expect(expiration.status).toBe("blocked");
    expect(expiration.reason).toMatch(/could not parse/);
  });

  it("computes a renewal notice deadline by subtracting the parsed notice period from expiration", () => {
    const result = deriveCriticalDates({
      documentId: "doc-1",
      runId: "run-1",
      extractions: [
        makeField({ fieldKey: "expiration_date", value: "December 31, 2029" }),
        makeField({
          fieldKey: "renewal_notice_deadline",
          value: "not less than one hundred eighty (180) days prior to the Expiration Date",
        }),
      ],
    });

    const deadline = byType(result, "renewal_notice_deadline");
    expect(deadline.status).toBe("computed");
    expect(deadline.value).toBe("2029-07-04");
    expect(deadline.sourceFieldKeys).toEqual(["expiration_date", "renewal_notice_deadline"]);
  });

  it("blocks the renewal notice deadline when expiration itself is blocked, without trying to parse notice text", () => {
    const result = deriveCriticalDates({
      documentId: "doc-1",
      runId: "run-1",
      extractions: [
        makeField({ fieldKey: "renewal_notice_deadline", value: "180 days prior to expiration" }),
      ],
    });

    const deadline = byType(result, "renewal_notice_deadline");
    expect(deadline.status).toBe("blocked");
    expect(deadline.reason).toMatch(/expiration_date must be resolved/);
  });

  it("blocks the renewal notice deadline when the notice period text can't be parsed", () => {
    const result = deriveCriticalDates({
      documentId: "doc-1",
      runId: "run-1",
      extractions: [
        makeField({ fieldKey: "expiration_date", value: "December 31, 2029" }),
        makeField({
          fieldKey: "renewal_notice_deadline",
          value: "a commercially reasonable period before expiration",
        }),
      ],
    });

    const deadline = byType(result, "renewal_notice_deadline");
    expect(deadline.status).toBe("blocked");
    expect(deadline.reason).toMatch(/could not parse a notice period/);
  });

  it("computes the next escalation date one year after commencement for a recognized annual cadence", () => {
    const result = deriveCriticalDates({
      documentId: "doc-1",
      runId: "run-1",
      extractions: [
        makeField({ fieldKey: "commencement_date", value: "January 1, 2024" }),
        makeField({
          fieldKey: "escalation_type",
          value: "Fixed percentage annual escalation (2.5% per Lease Year)",
        }),
      ],
    });

    const escalation = byType(result, "next_escalation");
    expect(escalation.status).toBe("computed");
    expect(escalation.value).toBe("2025-01-01");
  });

  it("blocks the escalation date for an unrecognized cadence rather than guessing", () => {
    const result = deriveCriticalDates({
      documentId: "doc-1",
      runId: "run-1",
      extractions: [
        makeField({ fieldKey: "commencement_date", value: "January 1, 2024" }),
        makeField({ fieldKey: "escalation_type", value: "CPI-indexed, adjusted each January" }),
      ],
    });

    const escalation = byType(result, "next_escalation");
    expect(escalation.status).toBe("blocked");
    expect(escalation.reason).toMatch(/not recognized as annual/);
  });

  it("blocks the escalation date when neither escalation field was extracted", () => {
    const result = deriveCriticalDates({
      documentId: "doc-1",
      runId: "run-1",
      extractions: [makeField({ fieldKey: "commencement_date", value: "January 1, 2024" })],
    });

    expect(byType(result, "next_escalation").status).toBe("blocked");
  });
});
