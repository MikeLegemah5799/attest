import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { listDocuments } from "./queries/documents";
import { seedFixtureDocuments } from "./seed";

const FIXTURE_SLUGS = [
  "eloan-metro-square-jacksonville",
  "8x8-sunnyvale-maude-ave",
  "8x8-san-jose-onel-drive",
  "heritage-bank-walnut-creek-ygnacio-plaza",
  "tekelec-morrisville-paramount-parkway",
  "radiant-systems-centreport-fort-worth",
  "avi-biopharma-north-creek-bothell",
  "fhlb-seattle-century-square",
  "circuit-research-labs-san-leandro-wicks",
  "entropic-communications-sorrento-san-diego",
];

// Deliberately doesn't delete the fixture-slug documents before/after —
// real pipeline runs (ingest/extract/verify/persist/derive) can attach
// pages/extractions/derived_dates/risk_flags rows to these exact documents
// via unenforced-by-cascade foreign keys, and deleting the document out
// from under them throws a foreign-key constraint error. Testing against
// whatever real state already exists is also more representative — "seed
// again on an already-seeded, already-processed db" is the actual
// operation this script performs in practice.
describe("seedFixtureDocuments (real db)", () => {
  it("registers all 10 starter-set fixtures and is idempotent", () => {
    const first = seedFixtureDocuments();
    expect(first.created + first.skipped).toBe(10);

    const second = seedFixtureDocuments();
    expect(second.created).toBe(0);
    expect(second.skipped).toBe(10);

    const seeded = listDocuments().filter((d) => FIXTURE_SLUGS.includes(d.slug));
    expect(seeded).toHaveLength(10);
    for (const doc of seeded) {
      expect(doc.title.length).toBeGreaterThan(0);
      const filePath = path.join(process.cwd(), "fixtures", "leases", doc.filename);
      expect(existsSync(filePath), `missing fixture file for ${doc.slug}: ${filePath}`).toBe(true);
    }
  });
});
