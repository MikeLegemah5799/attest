import path from "node:path";

import { describe, expect, it, vi } from "vitest";

vi.mock("./client", () => ({ getAnthropicClient: vi.fn() }));

import type { RawExtractedField } from "./types";
import { getAnthropicClient } from "./client";
import { verify } from "./verify";

const mockedGetClient = vi.mocked(getAnthropicClient);
const fixturePath = path.join(
  import.meta.dirname,
  "../../fixtures/leases/eloan-metro-square-jacksonville.pdf",
);

function makeField(overrides: Partial<RawExtractedField>): RawExtractedField {
  return {
    fieldGroup: "term",
    fieldKey: "test_field",
    label: "Test Field",
    value: "some value",
    evidenceText: "OFFICE LEASE AGREEMENT",
    pageNumber: 1,
    confidence: 0.9,
    ...overrides,
  };
}

describe("verify (real grounding against a fixture, mocked verifier judgment)", () => {
  it("blocks ungrounded fields without ever calling the verifier", async () => {
    const parse = vi.fn();
    mockedGetClient.mockReturnValue({ messages: { parse } } as never);

    const fields = [
      makeField({
        fieldKey: "fabricated",
        evidenceText: "this exact sentence is not anywhere on page 1",
      }),
    ];

    const [result] = await verify({ documentId: "doc-1", filePath: fixturePath, fields });

    expect(result.groundingStatus).toBe("ungrounded");
    expect(result.verifierStatus).toBeNull();
    expect(result.status).toBe("blocked");
    expect(result.boundingBox).toBeNull();
    expect(parse).not.toHaveBeenCalled();
  });

  it("blocks a grounded field the verifier rejects, regardless of confidence", async () => {
    mockedGetClient.mockReturnValue({
      messages: {
        parse: vi.fn().mockResolvedValue({ parsed_output: { real_field: "rejected" } }),
      },
    } as never);

    const fields = [
      makeField({
        fieldKey: "real_field",
        confidence: 0.99,
        evidenceText: "OFFICE LEASE AGREEMENT",
      }),
    ];

    const [result] = await verify({ documentId: "doc-1", filePath: fixturePath, fields });

    expect(result.groundingStatus).toBe("grounded");
    expect(result.boundingBox).not.toBeNull();
    expect(result.verifierStatus).toBe("rejected");
    expect(result.status).toBe("blocked");
  });

  it("marks a grounded, confirmed, high-confidence field grounded", async () => {
    mockedGetClient.mockReturnValue({
      messages: {
        parse: vi.fn().mockResolvedValue({ parsed_output: { real_field: "confirmed" } }),
      },
    } as never);

    const fields = [
      makeField({ fieldKey: "real_field", confidence: 0.95 }),
    ];

    const [result] = await verify({ documentId: "doc-1", filePath: fixturePath, fields });

    expect(result.status).toBe("grounded");
  });

  it("routes a grounded, confirmed, low-confidence field to review instead of grounded", async () => {
    mockedGetClient.mockReturnValue({
      messages: {
        parse: vi.fn().mockResolvedValue({ parsed_output: { real_field: "confirmed" } }),
      },
    } as never);

    const fields = [
      makeField({ fieldKey: "real_field", confidence: 0.4 }),
    ];

    const [result] = await verify({ documentId: "doc-1", filePath: fixturePath, fields });

    expect(result.status).toBe("review");
  });

  it("batches every grounded field into a single verifier call", async () => {
    const parse = vi.fn().mockResolvedValue({
      parsed_output: { field_a: "confirmed", field_b: "confirmed" },
    });
    mockedGetClient.mockReturnValue({ messages: { parse } } as never);

    const fields = [
      makeField({ fieldKey: "field_a", evidenceText: "OFFICE LEASE AGREEMENT" }),
      makeField({ fieldKey: "field_b", evidenceText: "METRO SQUARE" }),
    ];

    await verify({ documentId: "doc-1", filePath: fixturePath, fields });

    expect(parse).toHaveBeenCalledTimes(1);
  });
});
