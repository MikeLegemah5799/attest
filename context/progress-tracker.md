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

## In Progress

- None — UI shell is paused pending the backend pipeline; the skeleton is
  in place but no stage has real logic yet.

## Next Up

1. Pull 5–10 real commercial lease PDFs from SEC EDGAR EX-10 exhibits into
   `fixtures/` as a starter set (full 20-doc gold set can follow once the
   pipeline shape is proven).
2. Implement `lib/pdf/` for real — typed wrapper around `pdfjs-dist` for
   text + coordinate extraction (currently a typed stub only).
3. Build the ingest stage and confirm it runs cleanly against one fixture
   lease.
4. Extract → verify → persist stages, in that order, each landed and
   verified against one fixture before the next starts (per the scoping
   rules in ai-workflow-rules.md).
5. `lib/dates/` derivation engine (pure functions, Vitest-covered),
   replacing the hardcoded tracker/timeline/risk-flag data the UI currently
   renders.
6. Rewire the four existing screens from mock arrays
   (`app/lib/documents.ts`, `app/documents/_lib/review-data.ts`) to real
   `lib/db` queries, and replace the doc-viewer skeleton with a real
   `pdfjs-dist`-rendered PDF plus click-to-source highlighting.
7. Only once the pipeline is stable end to end: `evals/` harness against the
   gold set.

## Open Questions

- Exact field list per field group (parties, term, rent & escalation,
  options & notice, expenses, risk clauses) — need to lock the ~18 fields
  before writing extraction prompts, so gold-labeling has a fixed target.
- Confidence threshold for the review queue — start with a rough cutoff,
  recalibrate once the grounding/verifier/consistency signals are running
  against real fixtures.
- Whether self-consistency (3 runs at temp > 0) is affordable time-wise on
  all 6 date-feeding fields, or whether it needs to shrink to fewer fields
  under the two-day budget.
- How many gold-labeled documents are realistic to hand-label by Wednesday —
  20 is the target from project-overview.md, but this is the most likely
  scope to trim if time runs short.

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
