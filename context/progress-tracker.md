# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- UI shell built and reconciled against `ui-context.md` (static, pre-pipeline)
  — the four review-UI screens exist, match `context/screenshots/`, and run
  on shadcn/ui + Lucide as the spec requires, but still run entirely on
  hardcoded mock data.
- Backend skeleton now stood up per `architecture.md`: `lib/pipeline/`,
  `lib/db/`, `lib/dates/`, `lib/pdf/`, `evals/`, and `fixtures/` all exist
  with the shapes architecture.md defines, and pipeline dependencies
  (Drizzle, Anthropic SDK, pdfjs-dist, zod, plus drizzle-kit/tsx/vitest for
  tooling) are installed. No stage has real logic yet — every function is a
  typed stub that throws `not implemented`. Nothing is wired to the UI.

## Current Goal

- Get one lease flowing end to end through ingest → extract → verify →
  persist, even with rough output, before extending the UI further or
  touching the eval harness. The skeleton scaffolding is done; next is
  filling in the ingest stage against one fixture.

## Completed

- `app/page.tsx` — Documents list screen. Bordered table, one row per
  document, links to each document's review workspace.
- `app/documents/[slug]/page.tsx` — Review workspace. Extraction panel
  (field cards grouped by section, each with a status pill and citation) next
  to a document-viewer placeholder (skeleton lines, no real PDF rendering
  yet) and a category progress tracker.
- `app/documents/[slug]/queue/page.tsx` — Review queue. Filterable table
  (All flagged / Needs review / Blocked) of below-threshold fields.
- `app/documents/[slug]/risk/page.tsx` — Critical dates & risk. A derived
  critical-date timeline and a risk-flags table.
- `app/globals.css` — color and typography tokens matching
  `ui-context.md`'s spec exactly (bg-base, text-primary, accent-primary,
  state-success/warning/error, Inter/IBM Plex Mono).
- shadcn/ui + Lucide reconciliation — installed shadcn/ui (`components.json`,
  `lib/utils.ts`, `components/ui/{button,badge,table}.tsx`) and lucide-react,
  bridged shadcn's CSS-variable theme onto the existing brand palette instead
  of its default neutral scale (see Architecture Decisions), and removed the
  unicode glyphs (●▲✕) and hand-drawn SVG in favor of Lucide icons
  (FileCheck/AlertTriangle/FileX/Minus/ChevronDown/ChevronLeft/ChevronRight/
  ArrowRight/Upload). Added `components/attest/ConfidenceBadge.tsx` — the
  single grounded/review/blocked/neutral badge ui-context.md calls for,
  replacing the old duplicated `StatusPill`/`RiskPill`. Buttons, badges, and
  tables across all four screens now use the shadcn primitives; layout
  chrome (topbar, tabbar, timeline, field cards, tracker) stays hand-written
  CSS since shadcn has no equivalent for page-specific composition — see
  Session Notes for the scoping reasoning. `npm run build` and `npm run
  lint` both pass.
- Backend skeleton scaffolded per `architecture.md`'s file organization and
  six pipeline stages (ingest, extract, verify, persist, derive,
  surface-prep) — each stage is its own file in `lib/pipeline/` with a
  typed signature and a `not implemented` body, ready to be filled in one
  at a time. Full Drizzle schema written for all seven tables
  (`documents`, `pages`, `extractions`, `derived_dates`, `risk_flags`,
  `gold_labels`, `eval_runs`) with an initial migration generated
  (`lib/db/migrations/0000_tiny_energizer.sql`) — schema is structural, not
  pipeline logic, so it was safe to land in the same scaffolding step
  rather than splitting it out per ai-workflow-rules.md. `lib/db/queries/`
  has real (non-stub) CRUD per table since that's mechanical once the
  schema is fixed. `lib/pdf/` and `lib/dates/` are typed stubs only — real
  implementation is later, sequenced increments. Added `lib/types.ts` as
  the shared domain-type module code-standards.md calls for
  (`ExtractionField`, `DerivedDate`, `RiskFlag`, `ConfidenceStatus`,
  `FieldGroup`) and pointed the existing `ConfidenceBadge.tsx` at it
  instead of its own local declaration, so backend and UI share one
  vocabulary. Installed Drizzle, better-sqlite3, the Anthropic SDK,
  pdfjs-dist, zod, drizzle-kit, tsx, and vitest; added `db:generate`,
  `db:migrate`, `eval`, and `test` npm scripts. `npm run build`, `npm run
  lint`, and `npx tsc --noEmit` all pass; `npm run eval` and `npm run test`
  correctly fail (not-implemented / no tests yet) until their stages land.
- `fixtures/leases/` seeded with a 10-document starter set of real commercial
  office lease PDFs sourced from SEC EDGAR EX-10/EX-99 exhibits, with mixed
  provenance: 5 were filed on EDGAR natively as PDF (E-Loan, Inc. — Metro
  Square, Jacksonville FL; 8x8, Inc. — two distinct leases, Sunnyvale CA and
  San Jose CA; Heritage Commerce Corp / Heritage Bank of Commerce — Walnut
  Creek CA; Tekelec — Morrisville NC), and 5 more were filed on EDGAR only as
  HTML and converted locally to PDF with headless Google Chrome
  (`--print-to-pdf --no-pdf-header-footer`) once the native-PDF pool was
  exhausted — genuine text-layer PDF EX-10 exhibits are rare on EDGAR, since
  the vast majority of exhibits (including all 5 of these) are filed as HTML
  (Radiant Systems, Inc. — Fort Worth TX; AVI Biopharma, Inc. — Bothell WA;
  Federal Home Loan Bank of Seattle — Seattle WA; Circuit Research Labs, Inc.
  — San Leandro CA; Entropic Communications, Inc. — San Diego CA). Every file,
  regardless of provenance, was downloaded directly from `sec.gov` with a
  descriptive `User-Agent`, spot-checked as a genuine, fully filled-in,
  standalone office lease (not an amendment stub, sublease summary, or blank
  template), and verified via `pdftotext` to carry a real, clean embedded text
  layer (not a scanned image, not garbled OCR). Full provenance (filer, filing
  type/date, exhibit number, accession number, exact EDGAR URL, and — for the
  5 converted files — which tool did the HTML→PDF conversion) is in
  `fixtures/leases/SOURCES.md`, along with the rejected candidates from both
  search passes and why (non-office use, amendment-only, sublease, garbled
  OCR, whole-filing PDF copies, etc.). The full 20-doc gold set
  (`fixtures/gold/`) is unaffected — this was scoped as the starter set only,
  per `project-overview.md`.
- `lib/pdf/` implemented for real against pdfjs-dist's Node ("legacy") build
  — `loadPdf` opens a fixture PDF (the pdfjs `PDFDocumentProxy` is tracked in
  a module-private `WeakMap` keyed by the returned `PdfHandle`, so no
  pdfjs-dist type leaks past this module per code-standards.md); `getPageText`
  returns a page's full text plus positioned `PdfTextItem`s; `findEvidenceRects`
  is a pure function doing the grounding-check string match (invariant 1),
  tolerant of whitespace differences between quoted evidence and how pdf.js
  joins text runs, returning one merged rect per matched visual line. Verified
  end to end against the real `eloan-metro-square-jacksonville.pdf` fixture
  (52 pages, real extracted text, real grounded/ungrounded matches), plus a
  synthetic unit suite for `findEvidenceRects` — 10 Vitest tests total, all
  passing. `npm run build`, `npm run lint`, and `npx tsc --noEmit` all pass.
  Known limitation, not solved in this pass: a word hyphenated across a line
  wrap in the source PDF won't match evidence text that spells it without the
  break, since pdf.js reports the hyphen as an ordinary character with no
  dehyphenation signal.
- Ingest stage (1/6) implemented for real: loads a fixture via `lib/pdf/`,
  writes each page's text to `<PAGE_TEXT_CACHE_DIR>/<document_id>/<page>.txt`
  (default `./cache/pages`), inserts the `pages` text-index rows, and marks
  the document `ingested` with its real page count (added
  `markDocumentIngested` to `lib/db/queries/documents.ts` — the schema had a
  `page_count` column nothing wrote to yet). Verified end to end against
  `eloan-metro-square-jacksonville.pdf`: all 52 pages ingested, cached, and
  indexed, document status and page count correctly updated, cache files
  contain real text. Ran `npm run db:migrate` to create the local `attest.db`
  the test runs against. Added `vitest.config.mts` (was missing entirely —
  no test before this one imported anything through the `@/` path alias, so
  the gap was latent) to resolve `@/*`, matching `tsconfig.json`. `attest.db`,
  its `-shm`/`-wal` files, and `cache/` are gitignored for now — this is
  local dev/test state, not the deliberately seeded, demo-ready database
  `architecture.md` describes; that gets committed once a real
  fixture-seeding step exists (see Next Up). `npm run build`, `npm run lint`,
  and `npx tsc --noEmit` all pass; ingest's test suite is idempotent
  (re-runnable without manual cleanup).
- Extract, verify, and persist (stages 2–4/6) implemented for real, each
  verified against `eloan-metro-square-jacksonville.pdf` before the next
  started, per the scoping rules.
  - **Field list resolved** (was an open question) — see
    `project-overview.md`'s new "Field List" section and
    `lib/pipeline/fields.ts`, the single source of truth for the 18 field
    specs (key, group, label, description) both `extract.ts`'s prompts and
    any future gold-labeling/UI code should read from.
  - **`extract.ts`**: two-pass Claude extraction exactly as
    architecture.md describes — a routing pass (`effort: "medium"`, cheaper
    since it's coarse page→group classification) maps pages to the six
    field groups from condensed per-page previews, then one targeted pass
    per group (`effort: "high"`, only called for groups routing actually
    found pages for) extracts that group's fields from only its routed
    pages' full text. All Claude calls use `client.messages.parse()` +
    `zodOutputFormat` (code-standards.md — parsed and validated before
    treated as structured data); a field the model marks `found: false`,
    or whose returned page number isn't one of the pages it was actually
    shown (a hallucination guard), is dropped rather than persisted.
  - **`verify.ts`**: grounding check first (invariant 1) via
    `lib/pdf/findEvidenceRects` — re-opens the source PDF (`loadPdf`) for
    positioned text items rather than reading the ingest text cache, since
    bounding boxes need geometry the plain-text cache doesn't carry; added
    `filePath` to `VerifyInput` for this (mirrors `IngestInput`, wasn't in
    the original stub). Only grounded fields go to the verifier — a single
    batched Claude call judging all of them at once (not one call per
    field) — so an ungrounded field never costs an LLM call it can't
    possibly pass. **Confidence threshold resolved** (was an open
    question, which explicitly called for "start with a rough cutoff,
    recalibrate once the signals are running against real fixtures") at
    `0.7`, local to `verify.ts`. Status derivation: ungrounded → `blocked`;
    grounded + verifier-rejected → `blocked`; grounded + confirmed + below
    threshold → `review`; grounded + confirmed + at/above threshold →
    `grounded`.
  - **`persist.ts`**: straightforward — maps `VerifiedField[]` to
    `NewExtraction` rows via the already-implemented
    `insertExtractions`, marks the document `verified`.
  - **Self-consistency scoring is deliberately not implemented** — it was
    already flagged as possibly-cut in Open Questions, `VerifiedField` and
    the `extractions` schema have no field for it, and it's a distinct
    trust signal from grounding/verifier (both landed here). Left as an
    explicit gap, not silently dropped — see Open Questions.
  - **Model**: `claude-opus-5` for every call (routing, extraction,
    verifier) — accuracy-sensitive, and this is demo-scale volume, not a
    cost-sensitive production workload.
  - Unit-tested with a mocked Anthropic client — `extract.test.ts` (routing
    → targeted dispatch, found:false and hallucinated-page-number
    filtering), `verify.test.ts` (real grounding against the real fixture,
    all four status-derivation branches, verifier batching), `persist.test.ts`
    (real DB, immutability across two `runId`s) — 19 Vitest tests total, all
    passing, no live API calls in the default suite.
  - **Live end-to-end run** against the real fixture (not just mocked):
    11 of 18 fields found, all 11 grounded, all 11 verifier-confirmed, one
    correctly routed to `review` (the model honestly reported the renewal
    option's specific terms weren't stated on the pages it saw, at
    confidence 0.4) — the review-queue behavior worked exactly as designed
    on a real low-confidence case, not just a synthetic one. Persisted rows
    carry real computed bounding boxes. Cleaned up the live-check
    document/rows/cache afterward — this was a one-off verification run,
    not seed data. `npm run build`, `npm run lint`, `npx tsc --noEmit` all
    pass.
- `lib/dates/` derivation engine implemented — pure functions, no I/O, no
  LLM calls (invariant 3), confirmed by construction since neither file
  imports `lib/db` or `lib/pipeline`.
  - **`criticalDates.ts`**: four date types. `commencement`/`expiration`
    are direct pass-throughs of their extraction fields (parsed to ISO,
    gated on `status === "grounded"` — invariant 2's "confidence
    threshold" is read as verify's grounded/review/blocked status rather
    than re-deriving from the raw `confidence` number a second time, so
    the threshold lives in exactly one place). `renewal_notice_deadline`
    is computed — expiration minus a notice period parsed out of the
    `renewal_notice_deadline` field's free text (handles "(180) days" and
    "180 days" phrasings) — and blocks with a specific reason if
    expiration isn't resolved yet or the notice period can't be parsed.
    `next_escalation` only computes a date for a recognized annual
    cadence (regex on escalation_type/escalation_schedule text); anything
    else — CPI-indexed, an explicit step schedule, whatever — blocks with
    "cadence not recognized as annual" rather than guessing a date from a
    format it can't actually interpret. This is a deliberate scope limit,
    not full escalation-schedule parsing — logged in Open Questions.
  - **`riskFlags.ts`**: one flag per `risk_clauses` field
    (`lib/pipeline/fields.ts`), always all four regardless of what was
    extracted. Surfaced a real tension worth recording: grounding
    (invariant 1) only ever supports a *positive* claim — there's no
    verbatim quote to cite for "this lease has no co-tenancy clause" — so
    `extract.ts`'s `found: false` already conflates "confirmed absent"
    with "not observed in the routed pages," and this derivation
    inherits that. Resolved by treating anything not extracted, or that
    failed grounding/verification, as `blocked` (not `present: false`
    asserted as fact) — "extraction didn't find it" is never treated as
    proof it isn't there. Real absence-detection would need `extract.ts`
    to support a grounded negative claim, which it currently can't; noted
    as a gap, not fixed here (out of scope — this session's task was
    `lib/dates/`, not re-opening `extract.ts`).
  - 16 Vitest tests (both files, every branch: grounded/review/blocked/
    missing input, parseable/unparseable dates and notice periods,
    recognized/unrecognized escalation cadence) — all passing. Full suite
    now 35 tests. `npm run build`, `npm run lint`, `npx tsc --noEmit` all
    pass.
  - **Not implemented in this pass**: `lib/pipeline/derive.ts`, the
    orchestration stage that would read persisted extractions via
    `lib/db`, call these two functions, and write `derived_dates`/
    `risk_flags` rows. That stage does I/O, which `lib/dates/` itself
    must never do (invariant 3) — different system boundary, so kept as
    its own increment per the scoping rules, same as extract/verify/
    persist were each landed separately.

- `lib/pipeline/derive.ts` (stage 5/6) implemented — loads a run's
  extraction rows via `listExtractionsForRun`, calls
  `deriveCriticalDates`/`deriveRiskFlags`, persists both via the
  already-implemented `insertDerivedDates`/`insertRiskFlags`, marks the
  document `derived`. This is the thin I/O boundary the ADR at
  `lib/dates/` landing already called for — no logic of its own beyond
  wiring. Verified with a real-DB Vitest test (rows actually land in
  `derived_dates`/`risk_flags`, not just returned in memory), plus a live
  run of the full six-stage chain (ingest → extract → verify → persist →
  derive) against the real E-Loan fixture: matches the earlier live
  extract/verify run exactly — the three date fields that weren't
  extracted on that fixture correctly block with specific reasons, the
  one grounded risk field (`early_termination_right`) correctly shows
  `present: true`, the other three correctly block rather than assert
  absence. Full suite now 36 tests, all passing; cleaned up the live-check
  document/rows/cache afterward (throwaway verification, not seed data).
  `npm run build`, `npm run lint`, `npx tsc --noEmit` all pass.
- Fixture-seeding step implemented — `lib/db/seed.ts` (`npm run db:seed`),
  a hand-authored 10-entry manifest (slug, filename, title — titles pulled
  from each lease's actual property/tenant per
  `fixtures/leases/SOURCES.md`, not auto-generated from the filename
  slug) registering each `fixtures/leases/*.pdf` as a `documents` row via
  the already-implemented `insertDocument`. Idempotent (`getDocumentBySlug`
  check before insert, so re-running skips what's already there) and
  intentionally cheap — it only creates rows (`status: "pending"`), it does
  not run the pipeline against them; that's still a separate, costly,
  explicit step against real Claude calls for 10 documents, not something
  to trigger as a side effect of seeding. Tested against the real db (all
  10 register, idempotent re-run, and each manifest filename is checked to
  actually exist on disk — catches drift between the manifest and
  `fixtures/leases/`). Updated `README.md`'s "Running it" section, which
  previously skipped straight to `npm run dev` as if the seeded database
  already existed — added the `db:migrate`/`db:seed` steps and corrected
  the claim that the app already runs "against the seeded SQLite
  database" (it's still on mock UI data — see `surfacePrep` below). Full
  suite now 38 tests, all passing. `npm run build`, `npm run lint`,
  `npx tsc --noEmit` all pass. Ran `db:seed` for real against the local
  `attest.db` after tests (which clean up their own seeded rows, same as
  every other test in this codebase) — 10 documents now registered
  locally, `status: "pending"` since the pipeline hasn't run against them
  yet.

## In Progress

- None — UI shell is paused pending the backend pipeline; the skeleton is
  in place but no stage has real logic yet. All six pipeline stages now
  have real implementations except `surfacePrep` (stage 6/6, UI shaping).

## Next Up

1. `lib/pipeline/surfacePrep.ts` (stage 6/6) — the last unimplemented
   pipeline stage: loads a document's latest run (extractions, derived
   dates, risk flags) and shapes it for the review UI.
2. Rewire the four existing screens from mock arrays
   (`app/lib/documents.ts`, `app/documents/_lib/review-data.ts`) to real
   `lib/db` queries via `surfacePrep`, and replace the doc-viewer skeleton
   with a real `pdfjs-dist`-rendered PDF plus click-to-source highlighting.
3. Only once the pipeline is stable end to end: `evals/` harness against the
   gold set.

## Open Questions

- Whether self-consistency (3 runs at temp > 0) is affordable time-wise on
  all 6 date-feeding fields, or whether it needs to shrink to fewer fields
  under the two-day budget — grounding and verifier are implemented
  (`lib/pipeline/verify.ts`); self-consistency is the one trust-layer
  signal from project-overview.md still unbuilt.
- How many gold-labeled documents are realistic to hand-label by Wednesday —
  20 is the target from project-overview.md, but this is the most likely
  scope to trim if time runs short.
- `lib/dates/criticalDates.ts` only computes `next_escalation` for a
  recognized annual cadence — CPI-indexed schedules and explicit step
  schedules (real formats seen in the fixtures) block instead of
  computing. Worth revisiting if a fixture with a common non-annual
  pattern turns up during gold-labeling, but not worth generalizing
  against hypothetical formats first.
- `extract.ts`'s `found: false` can't distinguish "this clause is
  confirmed absent" from "not found in the routed pages" — grounding
  can only cite evidence for a positive claim. `lib/dates/riskFlags.ts`
  currently treats both the same way (`blocked`, not `present: false`).
  A real fix would need `extract.ts` to support a grounded negative
  claim (e.g. citing the section that would have contained the clause);
  not attempted here since it's an `extract.ts` change, not a
  `lib/dates/` one.

## Architecture Decisions

- **Next.js 16 (Active LTS), not 15** — 15 moved to maintenance-only in 2026
  and reaches end of support in October 2026; no reason to build new on a
  version already winding down.
- **Direct Anthropic API, not Bedrock** — production would use Bedrock for
  VPC posture and data residency, but this optimizes for a reviewer running
  the demo without provisioning AWS.
- **SQLite, not Postgres** — zero setup; the seeded database ships in the
  repo so the demo runs without any external dependency.
- **Citations via evidence-text string matching, not model-returned
  coordinates** — models can't reliably produce bounding boxes. The model
  returns verbatim evidence text and a page number; that's matched back
  against a text-item index built independently by `pdf.js` to compute
  highlight rects deterministically. This is also the core hallucination
  check: evidence that doesn't match the page is rejected before persisting.
- **Risk flags as presence/absence facts, not a composite score** — a
  weighted risk score would need validated weights this build has no way to
  justify. Flags are individually cited and let the user judge risk; the
  build takes the owner/asset-manager POV, stated explicitly since some
  flags (e.g. co-tenancy) read as risk or protection depending on which side
  of the lease you're on.
- **Derived dates block rather than guess on unverified inputs** — a
  `blocked` result with a stated reason is safer than a computed date built
  on a low-confidence field, since date errors compound silently.
- **Office leases only, no amendment-chain resolution** — scoped out to fit
  a two-day build; amendments are the leading "what I'd build next" answer
  for the follow-up discussion.
- **shadcn's `--primary` token is mapped to ink-dark (`--text-primary`), not
  `--accent-primary`** — ui-context.md states the verification accent and
  the "grounded" state are the same idea and "should never visually
  diverge." Feeding accent-primary into shadcn's generic default-button
  color would make every primary action (e.g. the Import button) read as
  "verified," diluting that signal. The only solid-color button in the
  mockups (the active filter chip) is ink-dark, not green, which confirmed
  ink-dark is the right generic `--primary`.
- **`pages` stores a text-cache pointer, not page text** — architecture.md's
  storage model calls SQLite the home for "document metadata, page text
  index, extractions...", while code-standards.md says page text "is cached
  to disk per document, not persisted as a giant text column." Read
  together, "index" means metadata about the cached text (page number,
  char count, cache file path), not the text itself — so the `pages` table
  holds `text_cache_path` + `char_count`, and the actual extracted text
  will live in per-document cache files written by `lib/pdf/` (path/format
  to be decided when ingest is implemented).
- **`risk_flags.source_field_key` is a field key, not a foreign key to
  `extractions.id`** — matches how `derived_dates.source_field_keys`
  already references source fields, so both derived tables read the same
  way and a risk flag stays traceable without an extra join, at the cost of
  not being a DB-enforced foreign key.
- **`better-sqlite3`, not `node:sqlite` or a WASM driver** — it's the
  standard, best-documented Drizzle SQLite driver and needs no extra
  runtime config; its native binding required approving an `npm`
  install-script gate (`node-gyp rebuild`), which is expected for a native
  module and was verified working before relying on it.
- **Fixture naming: `fixtures/leases/<company-slug-property-slug>.pdf`,
  kebab-case, no existing convention to match** — not specified in
  architecture.md, so picked one file-per-lease with a short, readable slug
  derived from tenant company + property/street identifier (e.g.
  `eloan-metro-square-jacksonville.pdf`, `8x8-sunnyvale-maude-ave.pdf`) rather
  than accession-number-based or numbered filenames, since the slug alone
  should let a reader guess the lease without opening `SOURCES.md`. Full
  provenance (filer, filing type/date, exhibit #, accession #, EDGAR URL)
  lives in `fixtures/leases/SOURCES.md` rather than encoded in the filename.
- **`BoundingBox` is top-left origin, PDF points at scale 1** — not specified
  anywhere before `lib/pdf/` needed it. Chosen because it's exactly what
  pdf.js's own `PageViewport.convertToViewportPoint({ scale: 1 })` produces,
  so `lib/pdf/` does no hand-rolled rotation/flip math and a client-side
  viewer only has to multiply by its own render scale. Documented on the
  type in `lib/types.ts` since it's shared across `lib/pipeline/`,
  `lib/dates/`, and the UI.
- **`pdfjs-dist` added to `next.config.ts`'s `serverExternalPackages`** —
  Next 16's App Router bundles server-side imports by default (unlike the
  Pages Router default most training data assumes); `better-sqlite3` and
  `canvas` are already in Next's built-in externalized-packages list but
  `pdfjs-dist` isn't, and its Node-specific `fs`/`process.getBuiltinModule`
  calls (used by its legacy Node build) break under Turbopack/webpack
  bundling if left in. Caught by reading `node_modules/next/dist/docs/`
  per `AGENTS.md` before writing `lib/pdf/`, not by hitting the failure at
  runtime.
- **`PdfTextItem.height` falls back to `Math.hypot(transform[2], transform[3])`
  when pdf.js reports `height: 0`** — a real, reproducible pdf.js behavior
  for horizontal text (confirmed against the E-Loan fixture, not just a
  defensive guess); the font-size scale lives in the transform matrix, not
  reliably in the `height` field. Without this, every text item on a normal
  horizontal-text page would produce a zero-height, invisible highlight rect.
- **`claude-opus-5` for every extraction/verify call, no cost-tiering** —
  accuracy-sensitive, demo-scale volume (a handful of documents, not
  production traffic), so there's no cost pressure that would justify
  trading accuracy for a cheaper model.
- **Confidence threshold: `0.7`** — resolved the open question with the
  rough-cutoff-now, recalibrate-later approach it explicitly called for.
  Local to `lib/pipeline/verify.ts`; recalibrate once more fixtures have
  run through it and there's a sense of what confidence values the model
  actually produces on genuinely ambiguous fields.
- **Verify re-derives positioned text items from the source PDF instead of
  reading the ingest text cache** — the text cache (`pages.text_cache_path`)
  only holds plain text; grounding needs `PdfTextItem`s with geometry to
  compute bounding boxes, which only `lib/pdf/getPageText` produces from an
  open `PdfHandle`. Added `filePath` to `VerifyInput` (mirrors
  `IngestInput`) rather than reconstructing a `fixtures/leases/` path
  inside `lib/pipeline/`, keeping that stage agnostic of where source PDFs
  actually live.
- **Verifier pass batches all grounded fields into one Claude call, not one
  call per field** — a field's evidence is already confirmed to appear
  verbatim on the page (the grounding check ran first); the verifier is
  only judging support, so there's no reason to pay for up to 18 separate
  round trips when one prompt listing every claim does the same job.

## Session Notes

- Full context lives in `project-overview.md` (what/why/scope),
  `architecture.md` (system design/data model), and `code-standards.md`
  (conventions) — read those three before resuming if picking this back up
  cold.
- The one-line pitch to keep in view while building: a May 2026 industry
  survey found 66% of CRE professionals use AI weekly or daily but only 5%
  trust it for real deal decisions — Attest is the trust layer, not just the
  extraction.
- Submission target: Friday, August 21, 11:59 PM ET. Internal target is
  Thursday to leave a buffer day.
- Keep prompts and commit history as you go — the recruiter explicitly asked
  for these for the harness/process discussion, so don't reconstruct them
  after the fact.
- The four UI screens were built directly against `context/screenshots/`
  mockups before any backend work started, out of the sequence
  `progress-tracker.md` originally called for (skeleton → ingest → extract →
  verify → persist, before touching the UI). Worth naming plainly in the
  follow-up discussion as a deliberate sequencing deviation, not an
  oversight — it front-loaded design validation against the provided
  mockups. The screens are static (hardcoded arrays, no `lib/db`) and will
  need rewiring once the pipeline lands.
- shadcn/ui + Lucide reconciliation scope: only the pieces with a real
  primitive equivalent were converted — buttons, badges, and tables. Layout
  chrome specific to this product (topbar, tabbar, the critical-dates
  timeline, field cards, the category tracker) was left as hand-written CSS
  in `app/globals.css` rather than rewritten as raw Tailwind utility strings
  in JSX, since `ui-context.md`'s Component Library section scopes shadcn to
  base components and describes layout patterns in prose, not as a mandate
  to eliminate all custom CSS. The shadcn CLI's own `init` output also
  pulled in dead scaffolding not used anywhere in this build — dark-mode
  variants (ui-context.md is explicitly light-only), sidebar/chart tokens,
  and a decorative shimmer/scroll-fade utility import — all removed per
  code-standards.md's "no dead scaffolding" rule.
