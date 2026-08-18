# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Not started — planning complete (project-overview.md, architecture.md,
  code-standards.md written and reviewed). Implementation starts next
  session.

## Current Goal

- Stand up the project skeleton and get one lease flowing end to end through
  ingest → extract → verify → persist, even with rough output, before
  touching the UI or the eval harness.

## Completed

- None yet.

## In Progress

- None yet.

## Next Up

- Scaffold Next.js 16 app with the `app/`, `lib/pipeline/`, `lib/db/`,
  `lib/dates/`, `lib/pdf/`, `evals/`, `fixtures/` structure from
  architecture.md.
- Pull 5–10 real commercial lease PDFs from SEC EDGAR EX-10 exhibits into
  `fixtures/` as a starter set (full 20-doc gold set can follow once the
  pipeline shape is proven).
- Define the Drizzle schema for `documents`, `pages`, `extractions`,
  `derived_dates`, `risk_flags`, `gold_labels`, `eval_runs`.
- Build `lib/pdf/` — typed wrapper around `pdfjs-dist` for text + coordinate
  extraction.
- Build the ingest stage and confirm it runs cleanly against one fixture
  lease.

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
