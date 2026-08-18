# Attest
 
A lease intelligence tool that extracts key terms from commercial lease
PDFs, verifies every extracted value against the source document before
trusting it, and derives critical dates and risk flags from that
verified data — with a citation trail from any field back to the exact
page and passage it came from.
 
Built for the Newmark Staff Software Engineer take-home.
 
## Why this problem
 
A May 2026 industry survey (First American Data & Analytics / DealGround)
found that 66% of CRE professionals now use AI weekly or daily, but only
5% trust it enough to inform real deal decisions. That gap — high
adoption, low trust — is the actual problem. Most lease-abstraction tools
compete on extraction volume: more fields, faster turnaround. Attest
competes on the other side of that gap: making the extraction verifiable,
so the 5% number has a reason to move.
 
**Who it serves:** asset managers and lease administrators who currently
either read leases by hand or use an AI tool without a way to check its
work. The design point is a person deciding whether to *act* on an
extracted value — renew, flag, escalate — not just someone who wants a
faster read of a document they were going to read anyway.
 
## What I learned from research
 
- SEC EDGAR EX-10 exhibits are full of real, publicly filed commercial
  leases — full text, no synthetic data needed, and a real distribution
  of lease structures and drafting styles to test against.
- CRE lease admins already use the term "tickler" for critical-date
  tracking, which confirmed critical dates (not just field extraction) as
  a distinct, named need in the industry, not something I was inventing.
- Composite "risk score" tools are common in adjacent proptech but hard
  to defend — a weighted score implies validated weights that a two-day
  build (or most vendors, honestly) can't actually justify. That pushed
  the design toward individually-cited risk *flags* instead of a score.
## How I decided what was worth building
 
The take-home rewarded depth on one defensible thing over breadth across
many shallow things. I scoped to a single document type (office leases),
a single field set (~18 fields across six groups), and put the majority
of the build's effort into the verification layer rather than the
extraction surface area — because extraction alone is the commodity part
of this problem, and the trust layer is what's actually missing from the
market.
 
## Key assumptions and tradeoffs
 
- **Owner/asset-manager point of view.** Some lease clauses (co-tenancy,
  in particular) read as risk to one party and protection to the other.
  I picked the owner's side explicitly rather than building a
  perspective-agnostic system, and say so in the UI, not just in this
  doc.
- **Direct Anthropic API, not AWS Bedrock.** Production would run on
  Bedrock for the VPC posture and data residency lease documents
  warrant. This build optimizes for a reviewer running it without
  provisioning AWS.
- **SQLite, not Postgres.** Zero setup — the seeded database ships in the
  repo so the demo runs without any external dependency or API key.
- **No amendment-chain resolution.** A lease plus multiple amendments
  where the latest term wins is real, common complexity I scoped out to
  protect the two-day budget. See "What I'd build next."
- **Risk flags over a risk score.** Deliberately avoided a single
  weighted number in favor of individually-cited, presence/absence
  flags — see Research above.
## Architecture and technical decisions
 
Full detail in [`architecture.md`](./architecture.md), diagram in
[`architecture.png`](./architecture.png). Summary: a single Next.js 16
app, six-stage pipeline (ingest → extract → verify → persist → derive →
surface), SQLite via Drizzle, and an eval harness that reads the same
data store as the app rather than a parallel path.
 
The verification layer is the core technical decision. Three signals
combine to produce confidence, none of them self-reported by the model:
 
1. **Grounding** — the model returns verbatim evidence text and a page
   number; that text is string-matched against the source page before a
   value is ever persisted.
2. **Verifier pass** — a second model call judges whether the cited
   evidence actually supports the extracted value.
3. **Self-consistency** — repeated runs on the fields that feed date
   derivation, scored by agreement rate.
Fields below the confidence threshold are routed to a review queue
instead of shown as fact. Derived critical dates that depend on an
unverified field are `blocked` with a stated reason rather than
computed anyway — date errors compound silently, so the system is built
to refuse rather than guess.
 
## What I built
 
- The six-stage extraction pipeline described above, run against real
  SEC-filed office leases.
- A trust layer (grounding, verification, self-consistency) gating every
  extracted field before it's shown as fact.
- A derivation engine for critical dates and risk flags, built as pure
  functions over verified extraction data — no LLM calls, fully unit
  tested, with an explicit block-not-guess policy.
- A review workspace: PDF and extraction shown side by side, with
  click-to-source highlighting connecting any field back to its exact
  citation.
- A review queue for low-confidence fields, and a critical-dates/risk
  view per document.
- An eval harness (`npm run eval`) scoring the pipeline against a
  hand-labeled gold set, with field-level and derived-date accuracy
  reported separately, and run-to-run diffing via `run_id` /
  `prompt_version`.
See [`project-overview.md`](./project-overview.md) for full scope, and
[`ui-blueprint.md`](./ui-blueprint.md) plus the mockups in this repo for
the interface design.
 
## What I'd change or build next
 
- **Amendment-chain resolution** — the biggest gap between this build and
  a real production tool. Most leases in a working portfolio have
  amendments that supersede the original terms.
- **Portfolio-level rollup** — the document list already surfaces expiry
  and flag counts per lease; the natural next step is cross-lease
  reporting for a whole portfolio, not just single-document review.
- **Tighter self-consistency budget** — currently limited to the ~6
  fields feeding date derivation for cost reasons; worth revisiting which
  fields actually need it once real accuracy data exists.
- **A second lease type** — retail and industrial leases have different
  clause structures (percentage rent is far more common in retail, for
  instance); the six-field-group architecture should generalize, but it's
  untested outside office leases.
## Running it
 
```bash
npm install
npm run db:migrate # creates attest.db from the Drizzle schema
npm run db:seed    # registers the fixtures/leases/ starter set as documents
npm run dev        # starts the app (still on mock UI data — see progress-tracker.md)
npm run eval       # runs the gold-set evaluation and prints a scorecard
```
 
`db:seed` only registers each fixture as a `documents` row (fast, free, no
API calls) — it doesn't run the extraction pipeline against them. An
`ANTHROPIC_API_KEY` (in `.env` or exported) is needed to actually run
extraction/verification against a document.
 
## Repo map
 
- `app/` — routes, server actions, pages
- `lib/pipeline/` — the six pipeline stages
- `lib/db/` — schema and queries
- `lib/dates/` — critical-date and risk-flag derivation
- `lib/pdf/` — PDF text/coordinate extraction
- `evals/` — gold set, eval runner, scorecards
- `fixtures/` — seeded lease PDFs
- `architecture.md`, `project-overview.md`, `code-standards.md`,
  `ui-context.md`, `ui-blueprint.md` — full project context and decisions