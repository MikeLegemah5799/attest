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
- `lib/pipeline/surfacePrep.ts` (stage 6/6, the last unimplemented pipeline
  stage) implemented — loads the latest run's extractions/derived dates/
  risk flags via `lib/db`, then shapes them per its existing type contract:
  `fieldSections` (extractions grouped by field group), `trackerCategories`
  (`grounded`/`total` per group — `total` is the full 18-field spec count
  from `lib/pipeline/fields.ts`, not just what got extracted, so a
  half-extracted document shows real progress instead of 100%),
  `queueItems` (fields with status `review` or `blocked` — the below-
  threshold review queue), and `criticalDates`/`riskFlags` passed through
  as-is. All four collections are sorted into a fixed canonical order
  (field spec order for fields/queue, a hardcoded chronological order for
  the 4 date types, spec-declaration order for the 4 risk flags) rather
  than trusting SQLite row order, which isn't a guaranteed-stable contract
  for this. Per the stage's own doc comment, this returns domain data
  (`ExtractionField[]`, `DerivedDate[]`, `RiskFlag[]`) — it deliberately
  does **not** try to match `app/documents/_lib/review-data.ts`'s
  presentational mock shapes (formatted citation strings like `"p.1 ·
  ..."`, timeline `position` percentages); that formatting is `app/`'s job
  per the existing architecture, not derivation's.
  Verified against a real-DB test (grouping, tracker counts against the
  full spec, queue filtering, ordering — all asserted with fields
  deliberately inserted out of canonical order, to prove sorting is real
  and not just accidentally-correct insertion order) and a **live run of
  the complete six-stage chain** against the real E-Loan fixture — every
  stage, ingest through surfacePrep, in one pass. Full suite now 43 tests,
  all passing. `npm run build`, `npm run lint`, `npx tsc --noEmit` all
  pass. All six pipeline stages now have real implementations.
- UI rewired off real data. `app/lib/documents.ts` is now an async
  `lib/db`/`surfacePrep`-backed module (`listDocumentSummaries`,
  `getDocumentDetail`) instead of a static mock array; `app/documents/_lib/
  review-data.ts` kept its view-shaping role but the mock consts became
  pure transform functions (`toFieldSections`, `toTrackerCategories`,
  `toQueueItems`, `toTimeline`, `toRiskFlagViews`) over real domain data —
  matching the split code-standards.md already drew ("app/ owns final view
  formatting, not derivation"). All four screens (documents list, review
  workspace, review queue, critical dates & risk) now render real
  persisted data, with real empty states (not crashes) for the 9 of 10
  seeded documents that haven't been processed yet.
  - Dropped `DocumentSummary.name` (redundant with `title`, real schema
    only has one title field) and the `type` field is now a hardcoded
    `"Office"` constant, not a DB column — project-overview.md scopes out
    every other lease type, so a column for a constant isn't warranted.
  - The critical-dates timeline is genuinely different from the mock: real
    derived dates can be `blocked` (no valid position to plot), and more
    than one can block at once, so blocked dates render as a stacked list
    of reasoned callouts below the timeline instead of the mock's single
    hardcoded positioned one. Added `.blocked-dates`/`.blocked-date-callout`
    to `globals.css` for this (`.timeline-callout` stays absolute-positioned
    for the real on-timeline case; reusing it for the stacked list would
    have broken layout).
  - The doc-viewer PDF pane is *not* wired to real `pdfjs-dist` rendering
    or click-to-source highlighting in this pass — replaced the mock's
    hardcoded fake paragraph (which would now contradict real field data
    shown alongside it) with a short explanatory placeholder instead of
    building real rendering, which is a separate, substantial client-side
    feature. Logged as its own Next Up item, not silently dropped.
  - Verified in a real browser session against the running dev server, not
    just `npm run build`: the empty state for 9 unprocessed documents, then
    ran the live pipeline for real against the seeded
    `eloan-metro-square-jacksonville` document and confirmed all four
    screens render its real fields/tracker counts/queue items/blocked
    dates/risk flags correctly.
  - **Found and fixed a real bug this session's own testing surfaced**:
    `lib/db/seed.test.ts` deleted-and-recreated the 10 real fixture-slug
    `documents` rows on every test run, which threw a foreign-key
    constraint error the moment any of those documents had real
    pipeline data attached (pages/extractions/derived_dates/risk_flags
    reference `documents.id` with no cascade configured) — exactly what
    happened once the E-Loan demo run above existed. Rewrote the test to
    never delete those rows; it now asserts against whatever real state
    already exists (idempotent re-seed, all 10 present, each filename
    real) rather than resetting-then-testing. This also means `npm run
    test` no longer wipes real seeded documents as a side effect —
    previously it did, silently, each time (see: the `db:seed` re-runs
    logged in earlier Completed entries working around exactly this).
  - Refactored `DATE_TYPE_ORDER` out of `surfacePrep.ts` into a shared
    `CRITICAL_DATE_TYPES` export on `lib/dates/criticalDates.ts` — evals
    (below) needed the same four date-type strings, and hardcoding them a
    third time risked drift.
  - `npm run build`, `npm run lint` (zero warnings now — the evals stub
    warnings are gone too, see below), `npx tsc --noEmit` all pass.
- `evals/` harness implemented — `fieldsMatch` (type-aware comparator:
  tolerant of date-format differences and currency/comma formatting on
  values that are essentially just a number, exact-text fallback
  otherwise — deliberately does *not* try to reconcile monthly-vs-annual
  rent phrasing, since that's a real semantic difference, not a formatting
  one) and `runEval` (scores every document with gold labels against its
  latest run, field accuracy and derived-date accuracy as separate
  scorecards per project-overview.md Goal 3, records an `eval_runs` row).
  A gold label's `fieldKey` must resolve to one of the 18 extraction
  fields or 4 derived date types or `runEval` throws — a labeling typo
  fails loudly instead of silently shrinking the denominator and making
  accuracy look better than it is. Tested with synthetic gold labels
  (real db) covering both failure modes distinctly (field never
  extracted vs. extracted-but-wrong), field-group breakdown, the
  separate date-type scoring path, and the unrecognized-fieldKey throw.
  Ran `npm run eval` for real against the dev db: completes cleanly and
  reports honestly — `totalFields: 0` — since `fixtures/gold/` has no
  labeled documents yet (Open Questions already flags this as the
  likely-to-trim scope item). Full suite now 53 tests, all passing;
  `npm run lint` has zero warnings for the first time this session — the
  evals stub's unused-param warnings are gone along with the stub.
- First real gold-labeled document landed:
  `fixtures/gold/eloan-metro-square-jacksonville.json` (18 extraction-field
  labels, hand-read against the actual lease text — `pdftotext -layout`
  plus targeted `grep` to locate each clause, not skimmed) plus
  `lib/db/seedGold.ts` (`npm run db:seed-gold`) to sync `fixtures/gold/*.json`
  into `gold_labels`, idempotent like `db:seed`.
  - **Deliberately no derived-date gold labels for this document** —
    E-Loan's Commencement Date is defined conditionally (earlier of
    possession or substantial-completion delivery, Section 2.1), not as a
    fixed calendar date, so there's no absolute date to check a computed
    value against. A real, correct fact about this lease, not a labeling
    gap.
  - **Caught a real, source-confirmed typo while labeling**: the renewal
    notice period reads "six (61 months" in the lease's own text layer —
    confirmed identical via both `pdftotext` and this project's own
    `lib/pdf` (pdf.js) extraction, so it's in the source PDF itself, not a
    tool artifact. Labeled as 6 months (the spelled-out word is
    unambiguous) with a note explaining the discrepancy.
  - **Running `npm run eval` against this label set caught two real
    comparator bugs**, found by actually inspecting a real accuracy
    number (16.7%) rather than trusting the mechanism because it ran
    without error:
    1. `fieldsMatch`'s text fallback required exact equality, so
       `"Southpark Corporate Center, L.L.C."` (gold) vs `"...L.L.C., a
       Delaware limited liability company"` (extracted, same fact plus
       elaboration) scored as wrong. Added a containment fallback (one
       normalized value fully contained in the other) after exact-match
       and before giving up.
    2. The containment fallback's own guard was a 12-character minimum,
       which rejected `"E-Loan, Inc."` (11 characters, but obviously
       specific, not generic) as a match for `"E-Loan, Inc., a Delaware
       corporation"`. Replaced the character-count guard with a
       **2-word-minimum** guard — the actual property that distinguishes
       "specific enough to trust as a real match" from "generic enough to
       risk a coincidental substring," which character count doesn't
       capture.
  - Real accuracy after both fixes: **6/18 (33%)** on this document/run.
    The remaining misses split into two honest categories, not a single
    "accuracy is low" verdict: (a) fields the model genuinely didn't
    extract this run (`commencement_date`, `expiration_date`,
    `initial_term_length`, `renewal_notice_deadline`,
    `co_tenancy_clause`, `percentage_rent_clause` — some of these
    legitimately can't be grounded as absolute values, per the
    conditional-commencement point above; others are real misses) and
    (b) fields with long, genuinely-different-but-equally-valid
    paraphrasing (`expense_structure`, `early_termination_right`,
    `assignment_subletting_consent`, `renewal_option_terms`) that a
    text/containment comparator fundamentally cannot judge as
    semantically equivalent — that would need an LLM-as-judge comparator,
    a real feature, not a bug fix. `early_termination_right`'s gold label
    itself only exists because labeling it surfaced a genuine extraction
    gap: an earlier live run's extracted value covered casualty/
    condemnation termination rights but omitted Section 2.6's separate
    Cancellation Right entirely.
  - `evals/runner.test.ts` had to be restructured to measure its synthetic
    test document's contribution as a **delta against a freshly-computed
    baseline**, not an absolute total — now that real gold data exists in
    the shared dev db, `runEval()` (which scores every document with gold
    labels, by design) picks it up too, and the test's old exact-equality
    assertions broke the moment real gold data existed alongside it.
  - Full suite now 57 tests, all passing. `npm run build`, `npm run
    lint`, `npx tsc --noEmit` all pass.
- **3 more documents gold-labeled** (asked the user for scope rather than
  assuming it; they chose "a few more, 3-4 total" — 4 documents now done):
  `8x8-san-jose-onel-drive.json`, `circuit-research-labs-san-leandro-wicks.json`,
  `heritage-bank-walnut-creek-ygnacio-plaza.json` (18 extraction-field
  labels each, same close-reading standard as E-Loan — `pdftotext -layout`
  plus targeted `grep` to locate every clause).
  - **First document with genuinely fixed dates**: unlike the other three
    (all conditional/relative commencement definitions), Heritage Bank's
    Lease states `Commencement Date: August 16, 2007` directly as fact,
    with a 7-year term confirmed by its own Basic Rent schedule table —
    so this document got real `commencement`/`expiration` derived-date
    gold labels (`2007-08-16` / `2014-08-15`), the first ones that exist.
  - **Deliberately included a `next_escalation` gold label expected to
    score as a miss**: Heritage Bank's escalation dates anchor to
    September 1 each year (an artifact of the initial stub period), not
    to the August 16 commencement anniversary `lib/dates/criticalDates.ts`
    assumes — a real, already-documented limitation (Open Questions), not
    a labeling error. Kept it in rather than leaving it out just because
    it doesn't validate the current implementation.
  - 8x8's lease references "Addendum No. 1" for its renewal/extension
    terms, and Circuit Research Labs' renewal terms live in a separate
    Lease Rider — neither addendum is included in this filed exhibit for
    8x8 (confirmed: the PDF ends at signature blocks, 20 pages, matching
    `SOURCES.md`), so `renewal_option_terms`/`renewal_notice_deadline`
    are gold-labeled "not determinable from this document" for 8x8, a
    real, correct ground truth rather than a gap.
  - Ran the full pipeline (ingest → derive) against all three for real, so
    the eval numbers reflect genuine multi-document signal, not one data
    point. **Real result across all 4 labeled documents: 22/72 fields
    (30.6%), 1/3 derived dates (33.3%)**, with a real trend visible
    per-group: `parties_premises` 15/16 (94%) — names/addresses/square
    footage are reliably extracted and grounded — versus `risk_clauses`
    0/16 (0%), which mechanically confirms the architectural gap already
    logged in Open Questions: risk-clause fields can only be gold-labeled
    or extracted as positive claims, and this batch's documents mostly
    have *absent* risk clauses (co-tenancy, percentage rent), which
    `extract.ts` currently can't represent as a grounded "confirmed
    absent" — this isn't new information, but it's now a measured number
    instead of an inferred concern.
  - Full suite still 57 tests (gold files aren't test-covered beyond
    `seedGold.test.ts`'s existing idempotency check, which now covers 75
    labels instead of 18). `npm run build`, `npm run lint`,
    `npx tsc --noEmit` all pass.

## In Progress

- None. 4 of up to 20 target documents are gold-labeled and fully
  processed; everything else (pipeline, UI, eval mechanism) is wired end
  to end.

## Next Up

1. Real `pdfjs-dist`-rendered PDF viewer with click-to-source highlighting,
   replacing the placeholder text in the review workspace's doc-viewer
   pane — the one piece of the four screens still not wired to anything
   real.
2. Run the full pipeline against the remaining 6 seeded-but-unprocessed
   documents (4 of 10 are now processed) — needed before the documents
   list looks like a populated demo rather than mostly `0%`/`—` rows.
3. More gold-labeling, if there's time — 4 of up to 20 target documents
   done. Each one so far has taken close reading of a full lease (~20-50
   pages) across ~10-15 targeted clause lookups; that's the real
   per-document cost to weigh against how much more eval signal is needed.

## Open Questions

- Whether self-consistency (3 runs at temp > 0) is affordable time-wise on
  all 6 date-feeding fields, or whether it needs to shrink to fewer fields
  under the two-day budget — grounding and verifier are implemented
  (`lib/pipeline/verify.ts`); self-consistency is the one trust-layer
  signal from project-overview.md still unbuilt.
- How many gold-labeled documents are realistic to hand-label by Wednesday —
  20 is the target from project-overview.md, but this is the most likely
  scope to trim if time runs short. 1 of 10 starter documents is now
  labeled (`eloan-metro-square-jacksonville`, ~18 fields); it took close
  reading of the full ~50-page lease across ~15 clause lookups to do
  properly, which is the real data point for estimating the rest — not a
  guess. Asked the user directly rather than assuming a number.
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
