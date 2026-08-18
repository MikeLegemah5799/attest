import { existsSync } from "node:fs";
import path from "node:path";

import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { db } from "./client";
import { listDocuments } from "./queries/documents";
import { documents } from "./schema";
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

describe("seedFixtureDocuments (real db)", () => {
  beforeAll(() => {
    for (const slug of FIXTURE_SLUGS) {
      db.delete(documents).where(eq(documents.slug, slug)).run();
    }
  });

  afterAll(() => {
    for (const slug of FIXTURE_SLUGS) {
      db.delete(documents).where(eq(documents.slug, slug)).run();
    }
  });

  it("registers all 10 starter-set fixtures, each pointing at a real file on disk", () => {
    const first = seedFixtureDocuments();
    expect(first.created).toBe(10);
    expect(first.skipped).toBe(0);

    const seeded = listDocuments().filter((d) => FIXTURE_SLUGS.includes(d.slug));
    expect(seeded).toHaveLength(10);
    for (const doc of seeded) {
      expect(doc.status).toBe("pending");
      expect(doc.title.length).toBeGreaterThan(0);
      const filePath = path.join(process.cwd(), "fixtures", "leases", doc.filename);
      expect(existsSync(filePath), `missing fixture file for ${doc.slug}: ${filePath}`).toBe(true);
    }
  });

  it("is idempotent — re-running skips already-seeded documents instead of duplicating them", () => {
    seedFixtureDocuments();
    const second = seedFixtureDocuments();
    expect(second.created).toBe(0);
    expect(second.skipped).toBe(10);

    const seeded = listDocuments().filter((d) => FIXTURE_SLUGS.includes(d.slug));
    expect(seeded).toHaveLength(10);
  });
});
