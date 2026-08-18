# Architecture Context

## Stack

| Layer | Technology | Role |
| --- | --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript | App shell, route handlers, server actions |
| UI | Tailwind + shadcn/ui | Review UI, PDF viewer, review queue |
| Auth | None (demo scope) | Single-user local demo; no auth boundary |
| Database | Drizzle + SQLite | Documents, extractions, derived dates, risk flags, eval runs |
| PDF processing | pdfjs-dist | Text + coordinate extraction, source-span highlighting |
| Extraction | Anthropic SDK (Claude) | Two-pass field extraction, verifier pass |
| Testing | Vitest | Date-engine unit tests, eval harness |

## System Boundaries

- `app/` — routes and server actions only. No extraction or derivation logic lives here; it calls into `lib/`.
- `lib/pipeline/` — the six pipeline stages (ingest, extract, verify, persist, derive, surface-prep) as pure, independently callable functions. Owns all Claude calls.
- `lib/db/` — Drizzle schema and queries. The only layer allowed to touch SQLite directly.
- `lib/dates/` — the critical-date and risk-flag derivation engine. Pure functions over extraction rows, no I/O, no LLM calls.
- `evals/` — gold-labeled fixtures, the eval runner, and scorecard output. Reads the same `lib/db` layer as the app; never duplicates pipeline logic.

## Storage Model

- **SQLite (via Drizzle)**: all structured state — document metadata, page text index, extractions (value, evidence text, page, bbox, confidence, `run_id`, `prompt_version`), derived dates, risk flags, gold labels, eval run results. This is the single source of truth; the eval harness and the app read the same tables.
- **Filesystem (`fixtures/`)**: source lease PDFs and the 20-document gold set, seeded into the repo. Nothing is uploaded at runtime in the demo — documents are loaded from fixtures on startup.

## Auth and Access Model

- No authentication in this build — single-user local demo, run with one command.
- No ownership or multi-tenancy model. All documents and extractions are global to the local instance.
- Every extraction is versioned by `run_id` and `prompt_version` rather than gated by a user, so re-running the pipeline never silently overwrites prior results — old runs stay queryable for the eval diff.

## Invariants

1. No extracted field is shown as fact without a verifiable citation — every extraction carries `evidence_text` and a page number, and that text must be grounded (string-matched) against the source page before it is persisted.
2. Derived dates never guess. If a critical-date calculation's input field falls below the confidence threshold, the derivation emits a `blocked` result with a reason, not a best-effort date.
3. The derivation layer (`lib/dates/`) never calls the LLM and never performs I/O — it is pure functions over already-persisted extraction rows, so it can be unit tested without fixtures or network access.
4. Every extraction row is immutable once written and tagged with `run_id` + `prompt_version`. Re-running extraction creates new rows rather than mutating old ones, so any two runs can be diffed field by field.
5. The eval harness (`evals/`) reads through the same `lib/db` query layer as the app — it never re-implements scoring logic against a parallel data path, so a passing eval run reflects what the UI actually shows.
6. Route handlers in `app/` do not call the Anthropic SDK or SQLite directly — they call into `lib/pipeline/` and `lib/db/`, keeping business logic testable independent of Next.js.
