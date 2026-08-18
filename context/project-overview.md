# Attest

## Overview

Attest turns a commercial lease PDF into a reviewable, citation-backed record.
It extracts key lease terms with Claude, verifies every extracted value against
the source document before persisting it, derives critical dates and risk flags
from that verified data, and surfaces the result in a review UI where any field
can be traced back to the exact page and passage it came from. It's built for
asset managers, lease administrators, and analysts who currently either read
leases by hand or use AI tools they don't fully trust — a May 2026 industry
survey found 66% of CRE professionals use AI weekly or daily, but only 5% trust
it enough to inform real deal decisions. Attest is built to close that gap: not
by extracting more, but by making the extraction verifiable.

## Goals

1. Extract ~18 lease-economics fields (parties, term, rent & escalation,
   options & notice, expenses, risk clauses) from a lease PDF with every value
   traceable to a cited page and passage.
2. Derive critical dates (renewal notice windows, expiration, escalation dates)
   and risk flags (early termination, co-tenancy, assignment consent, etc.)
   from verified extraction data, never from a raw model guess.
3. Prove accuracy with numbers, not assertion — a repeatable eval harness
   scored against a 20-document hand-labeled gold set, with field-level and
   derived-date accuracy reported separately.

## Core User Flow

1. User opens the app; a set of seeded lease PDFs (from the fixtures directory)
   are listed as available documents.
2. User selects a lease. The pipeline runs (or loads a prior run): ingest,
   extract, verify, persist, derive.
3. User sees the lease PDF and its structured extraction side by side.
4. User clicks any extracted field and sees its source passage highlighted in
   the PDF.
5. User opens the review queue, a filtered view of fields below the confidence
   threshold, and resolves them by confirming or correcting against the source.
6. User views the derived critical-date timeline and risk-flag list for the
   lease, each traceable back to its source fields.

## Features

### Extraction pipeline

- Two-pass Claude extraction: a routing pass maps pages to field groups, a
  targeted pass extracts each group against only its relevant pages.
- Every extracted value carries verbatim evidence text and a page number.

### Trust layer

- Grounding check: evidence text is string-matched against the source page
  before a value is persisted.
- Verifier pass: a second model call judges whether the cited evidence
  actually supports the extracted value.
- Self-consistency scoring on the fields that feed date derivation.
- Confidence-gated review queue: low-confidence fields are queued for human
  review rather than shown as fact.

### Derived intelligence

- Critical-date engine: notice windows, renewal deadlines, and expiration
  dates computed deterministically from verified fields. Blocks (rather than
  guesses) when an input field is unverified.
- Risk flags: presence/absence facts (early termination, co-tenancy,
  assignment consent, percentage rent, etc.), each with a source citation.

### Review UI

- Side-by-side PDF and extraction view with click-to-source highlighting.
- Review queue filtered to low-confidence fields.

### Eval harness

- `npm run eval` scores the pipeline against a 20-document gold set with a
  type-aware comparator, run-to-run diffing via `run_id`/`prompt_version`, and
  a separate accuracy tier for derived dates.

## Scope

### In Scope

- Office lease documents only, sourced from public SEC EX-10 exhibits and
  hand-labeled for the gold set.
- Single lease at a time — no cross-lease portfolio rollup.
- Local, single-user demo: no auth, no multi-tenancy.
- Read-only review queue (confirm/correct a field; no assignment, no status
  workflow, no audit trail beyond `run_id` versioning).

### Out of Scope

- Amendment-chain resolution (a lease plus multiple amendments where the
  latest terms win).
- Portfolio-level rollup, reporting, or cross-lease analytics.
- Authentication, multi-tenancy, or role-based access control.
- File upload UI — documents are seeded from fixtures, not uploaded at
  runtime.
- Integration with lease-management platforms (Visual Lease, Yardi, MRI,
  Prophia, etc.).

## Success Criteria

1. A user can select a seeded lease and see its extracted fields, each with a
   visible source citation, without needing to read the underlying PDF first.
2. `npm run eval` runs against the 20-document gold set and prints a
   field-level accuracy scorecard, plus a separate derived-date accuracy
   score.
3. A field deliberately extracted with low confidence appears in the review
   queue rather than being presented as verified fact.
4. A critical date whose input field is unverified is `blocked` with a stated
   reason rather than silently computed.
5. Two consecutive eval runs with different `prompt_version` values can be
   diffed to show which fields improved or regressed.
