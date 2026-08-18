# Code Standards

## General

- Keep modules small and single-purpose — a pipeline stage, a query, a
  derivation function each live in their own file, not bundled into a shared
  "utils."
- Fix root causes, do not layer workarounds. If extraction is wrong, fix the
  prompt or the grounding check — do not patch bad output downstream with
  string cleanup.
- Do not mix unrelated concerns in one component or route. A route handler
  orchestrates; it does not contain extraction logic, date math, or SQL.
- Prefer pure functions wherever there's no I/O requirement — the derivation
  engine (`lib/dates/`) is the clearest example and the standard the rest of
  the codebase should default toward.
- No dead scaffolding. If a feature is out of scope (see project-overview.md),
  don't stub it — leave it out entirely and note it in the README.

## TypeScript

- Strict mode is required throughout the project.
- Avoid `any` — use explicit interfaces or narrowly scoped types. Extraction
  results, derived dates, and risk flags each get a defined type shared
  between `lib/pipeline/`, `lib/dates/`, and the UI, not re-declared per file.
- Validate unknown external input at system boundaries before trusting it —
  every Claude response is parsed and validated (zod) before it's treated as
  structured data; a malformed model response fails loudly rather than
  silently producing a bad extraction.
- No implicit `any` from untyped third-party modules — wrap `pdfjs-dist` calls
  behind a typed interface in `lib/pdf/` rather than importing its types
  ad hoc across the codebase.

## Next.js

- Default to server components. Only the PDF viewer, field-click highlighting,
  and review-queue interactions need `"use client"`.
- Add `"use client"` only when browser interactivity requires it — data
  fetching and derivation stay server-side.
- Keep route handlers focused on a single responsibility — a route calls into
  `lib/pipeline/` or `lib/db/` and returns a response; it does not itself call
  the Anthropic SDK or run SQL.
- Prefer server actions over API routes for internal mutations (e.g. marking a
  review-queue item resolved); reserve route handlers for anything that needs
  to be called independently of a form/UI action, like the eval runner.

## Styling

- Use CSS custom property tokens — no hardcoded hex values. Confidence and
  risk-flag states (grounded, needs-review, blocked) each map to a token, not
  an inline color.
- Follow shadcn/ui's default component and spacing conventions rather than
  introducing a parallel design system for a two-day build.
- Sentence case throughout the UI — labels, buttons, empty states.

## API Routes

- Validate and parse request input before any logic runs.
- This is a single-user local demo with no auth — skip auth/ownership checks,
  but leave a comment at each mutation point noting where that check would go
  in production. Do not fake an auth layer for appearance's sake.
- Return consistent, predictable response shapes — every route returns
  `{ data }` or `{ error }`, never a bare value or a thrown string.

## Data and Storage

- Metadata belongs in the database: document records, extraction rows,
  derived dates, risk flags, gold labels, eval runs — all in SQLite via
  Drizzle.
- Source PDFs and gold-set fixtures live on the filesystem (`fixtures/`), not
  as blobs in the database.
- Do not store large content directly in the database — page text extracted
  by `pdf.js` is cached to disk per document, not persisted as a giant text
  column.
- Every extraction row is immutable and versioned by `run_id` and
  `prompt_version`. Never update an extraction row in place — write a new one.

## File Organization

- `app/` — routes, server actions, and page components only. No extraction,
  derivation, or direct database access.
- `lib/pipeline/` — the six pipeline stages (ingest, extract, verify, persist,
  derive, surface-prep) as independently callable, independently testable
  functions. Owns all Claude calls.
- `lib/db/` — Drizzle schema and all queries. The only layer permitted to
  touch SQLite directly.
- `lib/dates/` — critical-date and risk-flag derivation. Pure functions only;
  no I/O, no LLM calls.
- `lib/pdf/` — the typed wrapper around `pdfjs-dist` for text, coordinate, and
  highlight-rect extraction.
- `evals/` — gold-set fixtures, the eval runner, and scorecard output. Reads
  through `lib/db/`, never a parallel data path.
- `fixtures/` — seeded lease PDFs and gold-set source documents.
