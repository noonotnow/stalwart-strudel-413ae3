# DESIGN.md — justlikekatie.com (coming-soon)

Written from the built result, not before it. This is the visual world for
the public coming-soon surface only; it does not describe or govern the
private tool elsewhere in this repo.

## Concept: Instrument Panel / Control Room

The page reads as a single dark instrument panel glimpsed mid-operation —
not a marketing hero, not a "we're launching soon!" banner. Four corner
readouts (channel id, live signal, status line, signature) frame a centered
plate of engraved text, like a control room window left lit overnight. The
visitor is looking *at* the room, not being sold *into* it.

This is deliberately its own visual world within the Just Like Katie
family — not a copy of the private tool's UI — but it shares the family's
actual DNA: the same dark near-black surface, the same warm gold accent,
and the same Inter/JetBrains Mono type pairing already used elsewhere in
this codebase (verified, not invented — see Typography below).

## Palette

All values tinted from the same two hues (near-black + warm gold); no
neutral grays were introduced.

| Token | Value | Role | Contrast vs. `#0e0e12` |
|---|---|---|---|
| `--bg` | `#0e0e12` | Base surface | — |
| `--bg-panel` | `#14141a` | Panel/card surface | — |
| `--text` | `#f0ede8` | Primary (headline) | 16.5:1 |
| `--gold` | `#c9a96e` | Accent (signal dot, borders, brand) | 8.61:1 |
| `--muted` | `#a89a7c` | Secondary/mono labels | 6.95:1 |
| `--edge` | rgba gold, low alpha | Hairline dividers | — |

All body-text pairings clear WCAG AA (4.5:1) with wide margin; `--muted`
was chosen specifically because it's warm-gold-tinted rather than a flat
gray, per this family's existing convention of tinting secondary text from
the accent hue instead of neutral gray.

## Typography

- **Inter** (headline, body) — already the established typeface across
  this codebase (root `index.html`, `phase0/src/utils/cardRenderer.ts`,
  `exportCanvas.ts`). Reused deliberately for family continuity, not
  picked by default; flagged and consciously kept (see Known Exceptions).
- **JetBrains Mono** — new to this surface, used exclusively for the HUD
  readouts (corner labels, patch-panel tag row) to create a genuine
  display/instrument-label register distinct from the headline's editorial
  voice.

## The HUD-corner grammar

Four small mono readouts anchored to each viewport corner, bracket-framed:

- **Top-left** — `JLK · APEX CHANNEL` (channel identity)
- **Top-right** — `SIGNAL — ON` with a pulsing gold dot (a live-ness cue,
  not a countdown or launch-date claim)
- **Bottom-left** — `STATUS — QUIETLY UNDER CONSTRUCTION` (the entire
  "coming soon" message; stated once, plainly, no urgency language)
- **Bottom-right** — `© KATIE HENDLEY`

At narrow widths (≤30rem) the bottom-left/right labels are allowed to wrap
onto two lines within a constrained max-width instead of colliding —
verified during mobile QA.

## Motion

One animation: the signal dot's ring pulses outward via `transform: scale()`
+ `opacity` (no blurred box-shadow/glow — a deliberate craft-floor fix; the
first draft used a chromatic shadow halo, flagged as an AI-cliché pattern
and replaced with a solid-border ring "ping"). Respects
`prefers-reduced-motion: reduce` with a static scaled/faded ring — verified
via emulated media query during QA.

## Content devices

- The required verbatim sentence is the page's sole headline, set as plain
  unified text (no inline emphasis) so it reads as one engraved statement.
- A "patch panel" tag row beneath it — `Fandom Analysis · Creative
  Projects · Acting Experiments · 'Built a Tool for That'` — echoes the
  sentence's own phrasing as a distinct instrument-panel device, once
  redundant inline emphasis was removed from the headline itself.
- No fake waitlist counts, launch dates, or newsletter capture — status is
  communicated once, in plain language, in the bottom-left readout only.
- No links to internal CREATE/PLAN/CONNECT/MEDIA tooling; no canonical
  public contact/social link existed in this repo to attach, so none is
  shown.

## Known exceptions (disclosed, not silent)

- **`overused-font` / Inter**: genuinely pre-existing family evidence
  (grep-verified elsewhere in the repo), suppressed via
  `.impeccable/config.json` → `detector.ignoreValues` with a documented
  reason. The standalone `detect.mjs` CLI does not currently filter
  per-finding ignores (only whole-file ignores), so it will still surface
  this one warning on a direct run — the post-edit hook itself no longer
  flags it. This is a tooling gap in the shared script, not an unaddressed
  design defect.
