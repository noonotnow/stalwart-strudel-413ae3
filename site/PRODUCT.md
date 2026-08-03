# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Two audiences land on the bare apex domain, `justlikekatie.com`, before any of Katie Hendley's actual tools do:
- Curious visitors who go straight to the root domain out of interest in Katie herself, expecting *something* to be there.
- WHOIS-driven web designers/agencies who see the domain registered, assume the (very real, very active) private platform underneath it is "unfinished" simply because the apex has no site, and cold-pitch to build one.

*[Inferred from the requesting brief, not a live interview — see disclosure below.]*

## Product Purpose
A quiet, intentional "yes, this is on purpose" signal at the apex domain. It exists so both audiences leave with the same read: the space is deliberately in-progress, personally run, and not abandoned or up for a commissioned rebuild. Success is a visitor (of either kind) forming that impression within seconds, without being sold anything or asked for anything.

## Positioning
A tighter, Notion-approved content contract (supplied after the initial build and treated as authoritative over the original single-sentence layout) governs the page's exact copy hierarchy. The page has exactly three jobs:
1. Signal intentionality — under construction *on purpose*, not abandoned, broken, or a "mystery Wix-shaped distress flare."
2. Explain the vibe using the required control-room sentence, framed as a personal creative system, not a startup landing page.
3. Protect private architecture — no names/links for the private tools, no product-launch implication, no backend explanation ("goblin wires stay behind the wall").

The approved copy hierarchy, rendered top to bottom:

1. "Signal from the Control Room" (mono eyebrow)
2. "justlikekatie.com is coming soon." (h1)
3. The required control-room sentence, restructured as a lede: "A tiny internet control room for Katie Hendley's fandom analysis, creative projects, acting experiments, and 'wait, I built a tool for that' moments."
4. A build-status paragraph: "This site is currently in build mode — gathering portfolio work, fandom systems, media experiments, and the tools behind them into one public home."
5. "More soon."
6. A small, deliberately non-dominant personality aside: "Built internally. Please do not feed the WHOIS marketers."

No neighboring generic "coming soon" template can truthfully make the control-room claim — it names a specific, cross-disciplinary practice (fandom analysis + creative work + acting + ad hoc tool-building) rather than a category.

## Operating Context
`justlikekatie.com` is the apex over a live ecosystem of Katie's own working subdomains (e.g. fandom-analysis tooling, a scheduling/planning tool, a personal admin cockpit, a study tool) that already exist and are actively used, but are private/internal and must never be named, linked, or exposed from this public page. The apex itself currently has no site, which is the entire reason WHOIS lookups misread it as unclaimed/neglected.

This page is deliberately decoupled from this repository's existing deployed application (a separate, unrelated private tool) and its build/deploy pipeline — it must not alter or ride on that existing routing, build command, or redirects.

## Capabilities and Constraints
- Fully static, single page. No backend, no forms, no data collection, no newsletter/waitlist infrastructure (none exists and none should be implied).
- No invented launch dates, countdowns, waitlist counts, testimonials, pricing, generic SaaS claims, dashboard screenshots, analytics badges, admin links, or product-launch framing of any kind.
- Must not link or name any of Katie's private tools (fandom analysis tool, planning/scheduling tool, personal admin cockpit, study tool, or any content-publishing/media pipeline), and must not explain how the private backend works.
- No contact or social link is included: a repo-wide search found no existing canonical public contact/social URL to reuse, and the brief permits one only if such a canonical link already exists. *[Confirmed absent by search, not asked live.]*
- Must render correctly at both desktop and mobile sizes and respect `prefers-reduced-motion`.
- Deployment: intended to be served as its own independent site bound to the apex domain, separate from this repo's existing deployed app. *[Inferred engineering assumption — the real-world domain-to-site binding for this repo could not be verified from repo contents alone.]*

## Brand Commitments
No prior public-facing brand exists for the bare apex domain itself. The requester asked for a "distinct editorial/control-room visual concept that belongs to the existing Just Like Katie family" — so the family's existing internal visual language is evidence to extend from, not a fixed system to reproduce:
- Dark near-black surface (`#0e0e12`/`#14141a`) with a warm gold accent (`#c9a96e`), plus a warm cream/ivory light alternative, drawn from this repo's existing (private) fandom-tool CSS tokens.
- Inter (Latin) + Noto Sans SC (CJK) type pairing, used across the existing private tooling.
- A "control room / data instrument" visual grammar (cards, tiers, structured readouts) native to the existing private fandom-analysis tool.

## Evidence on Hand
- `assets/cards/tokens/card-tiers.json` and `assets/cards/badges/*.svg` — existing accent-color tokens from the private fandom tool.
- Root `index.html` (legacy, undeployed) — carries the dark/light CSS custom-property palette referenced above.
- Sibling private tools confirm the subdomain-ecosystem pattern this page must gesture at only obliquely, never by name or link.
- No existing photography, logos, or favicon worth reusing (`phase0/public/favicon.svg` is an unmodified default Vite icon) — new mark work is original.

## Product Principles
1. Signal intent, not incompleteness — the page should read as "built this way on purpose," never as a placeholder apologizing for itself.
2. Charm over conversion — Persuade mode here means an intriguing personal signal, not a funnel; there is no CTA that asks for anything.
3. Truth over template — every word must be defensible; no category-standard "coming soon" filler claims.
4. Privacy by construction — nothing here may name, link, or preview any private tool, admin surface, or internal workflow.
5. One family, one new room — visually distinct from the private tools' actual UI, but unmistakably from the same hand.

## Accessibility & Inclusion
Must respect `prefers-reduced-motion` (no motion-dependent meaning), remain fully legible/usable with only static states, and work well at both desktop and mobile viewport sizes.

---
**Disclosure:** These answers were inferred directly from the requester's explicit, detailed brief rather than a live interview — the brief already answered init's three required questions (users/job, purpose/positioning, durable constraints) in full. Facts above marked *[inferred]* or *[confirmed absent by search]* were not separately confirmed live; everything else is drawn directly from repo evidence.
