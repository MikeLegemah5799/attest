# UI Context

## Theme

Light only. No dark mode. The design language is a document workspace, not a
dashboard — warm paper backgrounds, ink-dark text, and three deliberately
restrained state colors (grounded, needs review, blocked) that carry the
entire trust story. The PDF viewer and extraction panel should feel like the
lease itself, not a generic SaaS UI wrapped around it. No blue-and-white
enterprise palette, no dark near-black theme — this is a legal-register
product, closer to a well-typeset document than an app.

## Colors

Define your color tokens as CSS custom properties. All components must use
these tokens — no hardcoded hex values.

| Role | CSS Variable | Value |
| --- | --- | --- |
| Page background | `--bg-base` | `#F7F5F0` |
| Surface | `--bg-surface` | `#FFFFFF` |
| Primary text | `--text-primary` | `#1C1B19` |
| Muted text | `--text-muted` | `#6B6A63` |
| Primary accent | `--accent-primary` | `#3D5A47` |
| Border | `--border-default` | `#E4E0D6` |
| Error / blocked | `--state-error` | `#7A3B32` |
| Success / grounded | `--state-success` | `#3D5A47` |
| Warning / needs review | `--state-warning` | `#8A5A2B` |
| Grounded background | `--bg-success` | `#E8EDE6` |
| Needs review background | `--bg-warning` | `#F5EBDD` |
| Blocked background | `--bg-error` | `#F4E6E3` |

`--accent-primary` and `--state-success` intentionally share a value — the
verification accent and the "grounded" state are the same idea in this
product, so they should never visually diverge.

## Typography

| Role | Font | Variable |
| --- | --- | --- |
| UI text | Inter | `--font-sans` |
| Code/mono | IBM Plex Mono | `--font-mono` |

Inter for all interface chrome — labels, buttons, nav, table cells. IBM Plex
Mono only for literal data: field values pulled from the lease, `run_id`s,
confidence scores, file names. The mono/sans split doubles as a visual cue
for "this text came from extraction" vs. "this text is UI."

## Border Radius

| Context | Class |
| --- | --- |
| Inline / small UI | `rounded-md` (6px) — badges, pills, inline confidence tags |
| Cards / panels | `rounded-lg` (8px) — extraction field cards, review queue rows |
| Modals / overlays | `rounded-xl` (12px) — field detail modal, citation preview |

Kept modest across the board — a document-review tool should read as
precise, not soft. Nothing above 12px.

## Component Library

shadcn/ui on top of Tailwind. Components live in `components/ui/` — use the
CLI to add new components rather than writing from scratch (see Protected
Files in `code-standards.md`; these are not hand-edited). Two custom
components sit outside the shadcn set and live in `components/attest/`:
`ConfidenceBadge` (renders the grounded/needs-review/blocked state) and
`CitationHighlight` (the PDF-viewer overlay that highlights a field's source
span) — both consume the state tokens above, never a hardcoded color.

## Layout Patterns

- Review workspace: full-viewport split — PDF viewer on the left (fixed
  ~55% width), extraction panel on the right, no sidebar. Clicking a field
  on the right scrolls and highlights its source span on the left.
- Review queue: a filtered list view, not a modal — bordered rows, not
  cards, so many low-confidence fields can be scanned quickly (see the
  density note in `code-standards.md`).
- Document list: simple bordered table, one row per seeded lease, no
  pagination needed at demo scale.
- Modals: centered overlay with a light backdrop (`rgba(28,27,25,0.35)`, no
  blur) — used only for the citation detail view, not for primary
  navigation.
- Top bar: thin, bordered bottom, document name + confidence summary only.
  No global nav — this is a single-workflow tool, not a multi-page app.

## Icons

Lucide React. Stroke-based icons only, `--accent-primary` or
`--text-muted` for color, never filled variants. Sizes: `h-4 w-4` for
inline (table cells, badges), `h-5 w-5` for buttons and panel headers.
`FileCheck` for grounded, `AlertTriangle` for needs review, `FileX` for
blocked — kept consistent everywhere a state appears, from the review
queue to the confidence badge to the derived-date timeline.
