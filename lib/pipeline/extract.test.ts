import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("./client", () => ({ getAnthropicClient: vi.fn() }));

import { db } from "@/lib/db/client";
import { getDocumentBySlug, insertDocument } from "@/lib/db/queries/documents";
import { insertPages } from "@/lib/db/queries/pages";
import { documents, pages } from "@/lib/db/schema";

import { getAnthropicClient } from "./client";
import { extract } from "./extract";

const mockedGetClient = vi.mocked(getAnthropicClient);
const testSlug = "test-extract-fake-lease";

function fieldKeysOf(params: { output_config?: { format?: { schema?: { properties?: object } } } }) {
  return Object.keys(params.output_config?.format?.schema?.properties ?? {});
}

function deleteTestDocument() {
  const existing = getDocumentBySlug(testSlug);
  if (!existing) return;
  db.delete(pages).where(eq(pages.documentId, existing.id)).run();
  db.delete(documents).where(eq(documents.id, existing.id)).run();
}

describe("extract (mocked Claude, real db + page cache)", () => {
  let documentId: string;
  let tmpDir: string;

  beforeAll(async () => {
    deleteTestDocument();
    const doc = insertDocument({
      id: crypto.randomUUID(),
      slug: testSlug,
      filename: "fake-lease.pdf",
      title: "Test fixture — fake lease",
    });
    documentId = doc.id;

    tmpDir = await mkdtemp(path.join(tmpdir(), "attest-extract-test-"));
    const page1Path = path.join(tmpDir, "1.txt");
    const page2Path = path.join(tmpDir, "2.txt");
    await writeFile(
      page1Path,
      "OFFICE LEASE AGREEMENT\nLandlord: Acme Properties LLC\nTenant: Foo Corp\n" +
        "Premises: 100 Main St, Suite 200\nRentable Area: 5,000 square feet",
    );
    await writeFile(
      page2Path,
      "TERM\nCommencement Date: January 1, 2024\nExpiration Date: December 31, 2029\n" +
        "Initial Term: 5 years",
    );
    insertPages([
      { documentId, pageNumber: 1, charCount: 100, textCachePath: page1Path },
      { documentId, pageNumber: 2, charCount: 100, textCachePath: page2Path },
    ]);
  });

  afterAll(async () => {
    deleteTestDocument();
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("routes pages, extracts only found fields, and drops a hallucinated page number", async () => {
    const parse = vi.fn(async (params: Record<string, unknown>) => {
      const keys = fieldKeysOf(params as never);

      if (keys.includes("parties_premises")) {
        // Routing call — schema keys are the six field groups.
        return {
          parsed_output: {
            parties_premises: [1],
            term: [2],
            rent_escalation: [],
            options_notice: [],
            expenses: [],
            risk_clauses: [],
          },
        };
      }

      if (keys.includes("landlord_name")) {
        return {
          parsed_output: {
            landlord_name: {
              found: true,
              value: "Acme Properties LLC",
              evidenceText: "Landlord: Acme Properties LLC",
              pageNumber: 1,
              confidence: 0.95,
            },
            // Deliberately wrong page number — must be dropped even though found=true.
            tenant_name: {
              found: true,
              value: "Foo Corp",
              evidenceText: "Tenant: Foo Corp",
              pageNumber: 99,
              confidence: 0.9,
            },
            premises_address: {
              found: true,
              value: "100 Main St, Suite 200",
              evidenceText: "Premises: 100 Main St, Suite 200",
              pageNumber: 1,
              confidence: 0.9,
            },
            rentable_square_feet: {
              found: false,
              value: "",
              evidenceText: "",
              pageNumber: 1,
              confidence: 0,
            },
          },
        };
      }

      // term group
      return {
        parsed_output: {
          commencement_date: {
            found: true,
            value: "January 1, 2024",
            evidenceText: "Commencement Date: January 1, 2024",
            pageNumber: 2,
            confidence: 0.95,
          },
          expiration_date: {
            found: true,
            value: "December 31, 2029",
            evidenceText: "Expiration Date: December 31, 2029",
            pageNumber: 2,
            confidence: 0.95,
          },
          initial_term_length: {
            found: true,
            value: "5 years",
            evidenceText: "Initial Term: 5 years",
            pageNumber: 2,
            confidence: 0.9,
          },
        },
      };
    });

    mockedGetClient.mockReturnValue({ messages: { parse } } as never);

    const result = await extract({ documentId, runId: "run-1", promptVersion: "v1" });

    expect(result.documentId).toBe(documentId);
    expect(result.fields.map((f) => f.fieldKey).sort()).toEqual(
      [
        "landlord_name",
        "premises_address",
        "commencement_date",
        "expiration_date",
        "initial_term_length",
      ].sort(),
    );
    expect(result.fields.find((f) => f.fieldKey === "tenant_name")).toBeUndefined();
    expect(result.fields.find((f) => f.fieldKey === "rentable_square_feet")).toBeUndefined();

    // Only routing + the two routed groups should have been called, not all 6.
    expect(parse).toHaveBeenCalledTimes(3);

    const updatedDoc = getDocumentBySlug(testSlug)!;
    expect(updatedDoc.status).toBe("extracted");
  });
});
