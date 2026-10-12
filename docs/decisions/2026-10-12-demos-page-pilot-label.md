# Demos page in the top navigation; Lucid demo labeled Pilot

Date: 2026-10-12
Owner: Beth
Status: Proposed (Beth's direction 2026-10-12; final sign-off is this PR)

## Decision

- `/demos/` is the single place to find Bast demos, and "Demos" joins
  Platform, BastCare, and Contact in the primary navigation on every main-site
  page. Advisory pages keep their own separate navigation.
- The page brings together the three YouTube demos (same privacy-enhanced,
  click-to-load embed as the homepage), the BastCare captioned walkthrough
  (linked to `/bastcare/#bastcare-tour`, where the video already lives), and the
  ten-minute demo guide at `/platform/demo/`. Descriptions reuse existing copy.
- Only the Lucid Therapeutics demo carries a **Pilot** label (Beth clarified
  2026-10-12 that "pilot" applies to Lucid only). It is described as "a pilot
  of Bast applied to Lucid Therapeutics' patient information", replacing
  "production analytics". No further claim is made.
  The homepage `#demos` section stays and links to `/demos/`.

## Why

Demos were reachable only mid-homepage and from footers, and the demo guide was
two clicks deep under Platform. The Lucid card's "production" wording outran
the evidence: `docs/content-claims.md` listed a Lucid production deployment as
Draft.

## Guardrails

`scripts/check.mjs` requires the Demos link in each checked primary nav, five
demos on `/demos/` with only Lucid labeled Pilot, pilot wording on the Lucid card, and no
"production analytics" on demo surfaces.
