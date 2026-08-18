# AI Workflow Rules

## Approach

Build this project incrementally using a spec-driven workflow. Four context
files define what to build, how to build it, and the current state of
progress: `project-overview.md` (what and why), `architecture.md` (system
design and data model), `code-standards.md` (conventions), and
`progress-tracker.md` (current state). Always implement against these specs —
do not infer or invent behavior from scratch. If a prompt asks for something
these files don't cover, stop and resolve it in the relevant file before
writing code (see Handling Missing Requirements).

This project is a take-home submission with a hard deadline and a follow-up
discussion where the process itself is evaluated. That changes two defaults
from a normal project: commits should be small and legible enough to narrate
individually, and any assumption made without an explicit spec answer should
be written down, not just coded — the walkthrough will ask "why," not just
"what."

## Scoping Rules

- Work on one feature unit at a time — one pipeline stage, one schema
  addition, one UI panel.
- Prefer small, verifiable increments over large speculative changes. A
  pipeline stage that runs against one fixture lease and returns
  something is worth more than three stages sketched at once with nothing
  proven end to end.
- Do not combine unrelated system boundaries in a single implementation
  step — e.g. do not touch `lib/pipeline/` and `app/` review-queue UI in the
  same change.
- Do not start the eval harness before the extraction pipeline it scores is
  stable enough to run against a fixture without erroring — scoring
  broken output wastes the increment.

## When to Split Work

Split an implementation step if it combines:

- A pipeline stage change and a UI change (e.g. adjusting extraction fields
  and updating the review panel that displays them).
- Schema changes and the query/derivation logic that depends on them — land
  the Drizzle schema and migration first, verify it, then build against it.
- Extraction logic and derivation logic — `lib/pipeline/` (LLM calls) and
  `lib/dates/` (pure functions) are different invariants and different
  failure modes; changing both at once makes it unclear which one broke.
- Behavior not clearly defined in the context files — if implementing a step
  requires inventing a rule project-overview.md or architecture.md doesn't
  state, stop and resolve it there first.

If a change cannot be verified end to end quickly, the scope is too broad —
split it.

## Handling Missing Requirements

- Do not invent product behavior not defined in the context files — e.g. if
  the confidence threshold for the review queue isn't pinned down yet, don't
  silently pick a number and move on.
- If a requirement is ambiguous, resolve it in the relevant context file
  before implementing. Field list ambiguity goes in `project-overview.md`;
  data-model ambiguity goes in `architecture.md`; convention ambiguity goes
  in `code-standards.md`.
- If a requirement is missing, add it as an open question in
  `progress-tracker.md` before continuing. The four open questions already
  logged there (field list, confidence threshold, self-consistency scope,
  gold-set size) are the current known gaps — check that list before
  assuming something is undecided.

## Protected Files

Do not modify the following unless explicitly instructed:

- `components/ui/*` — shadcn-generated components. Customize via Tailwind
  classes and composition, not by editing the generated source.
- `fixtures/gold/*` — the hand-labeled gold set. These are ground truth for
  the eval harness; changing them changes what "correct" means, so any edit
  is a deliberate labeling decision, not an implementation side effect.
- `evals/runs/*` — historical eval output. Append new runs; never edit or
  delete a past run's recorded scorecard.
- Any third-party library internals (`node_modules`, `pdfjs-dist` internals,
  etc.) — wrap, don't fork.

## Keeping Docs in Sync

Update the relevant context file whenever implementation changes:

- System architecture or boundaries → `architecture.md`
- Storage model decisions → `architecture.md`
- Code conventions or standards → `code-standards.md`
- Feature scope → `project-overview.md`
- Any of the above, plus what was actually done → `progress-tracker.md`,
  every session

A decision that changes the data model or system design also gets a line in
`progress-tracker.md`'s Architecture Decisions section with the reason —
that section is the running ADR log for the follow-up discussion.

## Before Moving to the Next Unit

1. The current unit works end to end within its defined scope.
2. No invariant defined in `architecture.md` was violated.
3. `progress-tracker.md` reflects the completed work.
4. `npm run build` passes.
5. `npm run eval` still runs cleanly if the change touched anything in
   `lib/pipeline/` or `lib/dates/` — a unit that quietly breaks the eval
   harness is not done.
6. The commit for this unit stands on its own and could be explained in one
   or two sentences during the follow-up discussion.
