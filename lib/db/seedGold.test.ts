import { describe, expect, it } from "vitest";

import { getDocumentBySlug } from "./queries/documents";
import { listGoldLabelsForDocument } from "./queries/goldLabels";
import { seedGoldLabels } from "./seedGold";

// No deletion for the same reason as seed.test.ts: fixtures/gold/*.json is
// the real, protected, hand-labeled gold set, keyed by the real fixture
// slugs — asserting against whatever state already exists is both safer
// (no foreign-key surprises from real gold_labels data) and more
// representative of how this script is actually run.
describe("seedGoldLabels (real db, real fixtures/gold/*.json)", () => {
  it("seeds the eloan gold file and is idempotent", async () => {
    const first = await seedGoldLabels();
    expect(first.created + first.skipped).toBeGreaterThan(0);

    const second = await seedGoldLabels();
    expect(second.created).toBe(0);

    const doc = getDocumentBySlug("eloan-metro-square-jacksonville");
    expect(doc).toBeTruthy();
    const labels = listGoldLabelsForDocument(doc!.id);
    expect(labels.length).toBe(18);
    expect(labels.every((l) => l.expectedValue.length > 0)).toBe(true);
  });
});
