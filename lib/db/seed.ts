import { randomUUID } from "node:crypto";

import { getDocumentBySlug, insertDocument } from "./queries/documents";

/**
 * The 10-document starter set from `fixtures/leases/` (see
 * `fixtures/leases/SOURCES.md` for full provenance). Titles are derived
 * from each lease's actual property + tenant, not the filename slug.
 */
const FIXTURE_MANIFEST: { slug: string; filename: string; title: string }[] = [
  {
    slug: "eloan-metro-square-jacksonville",
    filename: "eloan-metro-square-jacksonville.pdf",
    title: "Metro Square, Jacksonville FL — E-Loan Lease",
  },
  {
    slug: "8x8-sunnyvale-maude-ave",
    filename: "8x8-sunnyvale-maude-ave.pdf",
    title: "810 West Maude Ave, Sunnyvale CA — 8x8 Lease",
  },
  {
    slug: "8x8-san-jose-onel-drive",
    filename: "8x8-san-jose-onel-drive.pdf",
    title: "2125 O'Nel Drive, San Jose CA — 8x8 Lease",
  },
  {
    slug: "heritage-bank-walnut-creek-ygnacio-plaza",
    filename: "heritage-bank-walnut-creek-ygnacio-plaza.pdf",
    title: "101 Ygnacio Plaza, Walnut Creek CA — Heritage Bank Lease",
  },
  {
    slug: "tekelec-morrisville-paramount-parkway",
    filename: "tekelec-morrisville-paramount-parkway.pdf",
    title: "5200 East Paramount Parkway, Morrisville NC — Tekelec Lease",
  },
  {
    slug: "radiant-systems-centreport-fort-worth",
    filename: "radiant-systems-centreport-fort-worth.pdf",
    title: "CentrePort Office Center, Fort Worth TX — Radiant Systems Lease",
  },
  {
    slug: "avi-biopharma-north-creek-bothell",
    filename: "avi-biopharma-north-creek-bothell.pdf",
    title: "North Creek Technology Campus, Bothell WA — AVI BioPharma Lease",
  },
  {
    slug: "fhlb-seattle-century-square",
    filename: "fhlb-seattle-century-square.pdf",
    title: "Century Square Building, Seattle WA — FHLB Seattle Lease",
  },
  {
    slug: "circuit-research-labs-san-leandro-wicks",
    filename: "circuit-research-labs-san-leandro-wicks.pdf",
    title: "Wicks Blvd, San Leandro CA — Circuit Research Labs Lease",
  },
  {
    slug: "entropic-communications-sorrento-san-diego",
    filename: "entropic-communications-sorrento-san-diego.pdf",
    title: "Arden Towers at Sorrento, San Diego CA — Entropic Communications Lease",
  },
];

/** Registers each starter-set fixture as a `documents` row, if not already present. */
export function seedFixtureDocuments(): { created: number; skipped: number } {
  let created = 0;
  let skipped = 0;
  for (const fixture of FIXTURE_MANIFEST) {
    if (getDocumentBySlug(fixture.slug)) {
      skipped += 1;
      continue;
    }
    insertDocument({ id: randomUUID(), ...fixture });
    created += 1;
  }
  return { created, skipped };
}

// Runnable directly via `npm run db:seed` (tsx). Wrapped so the function
// above stays importable/testable without triggering a run as a side effect.
if (import.meta.filename === process.argv[1]) {
  const result = seedFixtureDocuments();
  console.log(`Seeded ${result.created} document(s), skipped ${result.skipped} already present.`);
}
