# Adopt the Noviant GEO layer, with corrections

Date: 2026-08-28

## Decision

Deploy a GEO (Generative Engine Optimization) layer derived from Noviant's
2026-08-27 artifact drop, corrected against `docs/content-claims.md` and the
live product reality. Owner sign-off: Beth, relayed by Phil on 2026-08-28,
as answers to the seven gate questions in
`docs/proposals/2026-08-27-noviant-geo-adoption.md`.

What shipped:

- Expanded Organization JSON-LD on the homepage (legalName, Denver founding
  location, sameAs incl. YouTube and Crunchbase, founder + CTO Person nodes,
  OEDIT award, corrected BastCare offer).
- `/llms.txt` at the web root (corrected from Noviant ROSETTA).
- `/frames/claim-level-source-grounding/` (Noviant PRISM content rebuilt in
  the site template) plus a `/frames/` index; crosslinks from the homepage
  and principles page; sitemap entries.
- `/faq/` — visible FAQ with matching FAQPage schema, anchored by the
  Vast.ai disambiguation (Noviant SHIELD critical finding).
- `/team/` — Beth Rudden and Thanh Lam bios with Person schema.
- SoftwareApplication schema on `/bastcare/` (corrected: patient-facing
  free iOS app, not Noviant's clinician-interception description) and
  BreadcrumbList on `/bastcare/architecture/`.
- `scripts/check.mjs` guards for all of the above, including a forbidden
  token for the wrong legal name.

## The seven decisions

1. Legal entity: **Bast, Inc.** ("Bast AI" is the brand). The OEDIT press
   release independently uses "Bast, Inc."
2. Public contact for GEO surfaces: **beth@bast.ai** (site footers keep
   community@bast.ai).
3. "5 patents filed": **confirmed** — ledger row moved to Approved.
4. OEDIT grant: **verified** against the OEDIT announcement of May 16, 2024
   ($250,000, Early-Stage Capital and Retention, Advanced Industries
   Accelerator Program) and added to the ledger.
5. Competitor comparison table: **cut**. No published claims about other
   vendors' capabilities; category definitions that name no vendors remain.
6. Team page: **approved**; Thanh Lam's LinkedIn supplied
   (linkedin.com/in/thanh-lam-8441022a5).
7. Research article venue: **Substack**, posted by Beth. An edited,
   claim-checked draft is staged at
   `docs/proposals/substack-draft-ai-hallucination-prevention.md`.

## Explicitly not adopted

- LENS principles-page rewrite (voice misfit; would break check.mjs copy
  assertions). The live principles page gained only a crosslink aside.
- LENS homepage rewrite (July drop, same reasoning).
- Noviant's faqpage.json and softwareapplication.json as delivered (both
  misdescribed BastCare as a clinician-facing interception layer; corrected
  versions were written instead).
- The FORGE fact-drop as-is ("trust 100% of the time is achievable"
  removed; competitor claims removed; remainder edited into the Substack
  draft).

## Boundaries

- Every BastCare description in machine-readable content must match the
  approved posture: consent-first patient/caregiver app, free, not a
  medical device.
- The corrections list in the proposal doc goes back to Noviant so their
  account record (which still says "Bast AI, Inc." and the wrong BastCare
  description) is fixed before the next drop.
