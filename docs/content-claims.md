# Public Content Claims

This file keeps the public website honest without adding OpenSpec ceremony.
Each material claim should have an owner and evidence note before production
publish.

| Claim | Status | Owner | Evidence / note |
|---|---|---|---|
| Bast grounds AI in approved knowledge, ontology, and source material. | Approved public positioning | Beth | Owner requested the dedicated platform page on 2026-09-01; exact wording reuses the existing homepage position. See `docs/decisions/2026-09-01-bast-platform-splash-page.md`. |
| Every answer can be traced, checked, or refused. | Approved public positioning | Beth | Owner requested the dedicated platform page on 2026-09-01; the page expresses the existing answer, trace, or refusal position without adding a runtime guarantee. |
| Hosted, private cloud, or on prem deployment. | Approved public positioning | Beth | Owner requested the dedicated platform page on 2026-09-01; exact deployment wording reuses the existing homepage offer. |
| Relevant knowledge is selected before generation, reducing token load and noise. | Draft | Adam | Confirm compute/token reduction number before publishing any numeric claim. |
| Bast records blocked, missing, or out-of-scope answer paths. | Draft | Adam | Confirm analytics/refusal logging fields before production copy. |
| DVC featured Bast as a medical AI case study with full provenance, reproducible answers, and offline operation. | Draft | Beth | Public DVC blog link is used from homepage outcome teaser. Confirm final wording against DVC page. |
| Maryville University saved $1.2M in the first semester. | Draft | Beth | Investor deck and personal-site public copy use this proof point. Confirm approved public wording before launch. |
| Bast has 5 patents filed. | Approved | Beth / Legal | Confirmed 2026-08-28 (via Phil) during Noviant GEO adoption. Wording stays "patents filed", not "granted". Used on investor page, FAQ, llms.txt. |
| Bast, Inc. received a $250,000 OEDIT Advanced Industries Early-Stage Capital and Retention Grant (announced May 16, 2024). | Approved | Beth | Verified 2026-08-28 against the OEDIT press release, which names "Bast, Inc. - Denver, CO $250,000": <https://oedit.colorado.gov/press-release/oedit-announces-grants-to-42-colorado-startups-and-researchers-in-the-advanced>. Used in FAQ, llms.txt, Organization schema `award`. |
| Bast AI is not affiliated with Vast.ai (a GPU cloud marketplace). | Approved | Beth | Disambiguation published 2026-08-28 on /faq/ and llms.txt to counter AI-engine entity confusion (Noviant SHIELD critical finding). |
| The registered legal entity is Bast, Inc.; "Bast AI" is the brand name. | Approved | Beth | Decided 2026-08-28 (via Phil). Schema `legalName` uses Bast, Inc.; `scripts/check.mjs` forbids "Bast AI, Inc." in built output. |
| Competitor capability comparisons are not published. | Policy | Beth / Legal | Decision 2026-08-28: the Noviant comparison table asserting other vendors' incapabilities was cut. Category definitions that name no vendors are fine. |
| Bast has live deployments, paying customers, and healthcare pull. | Draft | Beth | Used as investor teaser framing from the June 2026 teaser PDF. Keep general unless approved names/numbers are added. |
| BastCare audio stays on the iPhone and Bast does not persist or log transcript text server-side. | Approved | Beth | Owner-approved wording for the public policy and App Store description; release evidence remains part of submission readiness. |
| A BastCare summary stays on the patient's iPhone unless the patient explicitly shares it with a CareTeam. | Approved | Beth | Owner-validated two-phone create, share, and unshare flow. |
| BastCare retains content-free operational metadata, de-identified token counts, and minimal deletion evidence. | Approved boundary | Beth | Mongo evidence and deletion implementation tests remain release evidence; public copy does not claim full deletion is currently live. |
| Full Bast account deletion removes account-linked identity, sessions, relay data, memberships, and local app data. | Not live | Beth / Thanh / Sarah | Do not present as available until the authenticated endpoint and iPhone success/failure flow are implemented and tested. The public page explicitly states the current limitation. |
| BastCare is not a medical device and does not diagnose, treat, monitor, predict, or recommend care. | Approved | Beth | Product-owner posture used consistently in public and App Store copy. |
| BastCare's displayed App Store rating average, rating count, and written reviews reflect Apple's latest verified U.S. public feeds. | Approved | Beth | Daily deployment refresh validates App Store ID `6789669565` and bundle ID `ai.bast.careloop`; see `docs/decisions/2026-09-01-bastcare-public-review-refresh.md`. |
| The current public HTTPS development deployment is operated as demo/staging; more than 25 users triggers a production-hardening review and is not an enrollment cap. | Approved decision | Beth | `bast-careloop/docs/decisions/2026-08-01-apple-store-bound-v2.md`. |
| BastCare 1.0 is free; paid BastCare Plus is future work. | Approved decision | Beth | Current public copy does not describe purchase, restore, or subscription management as a released feature. |
| Lucid Therapeutics reached production deployment with Bast (admin setup, governed knowledge, CAT building, production analytics). | Draft | Beth | Appears as a "client-confirmed" fact in Noviant's 2026-09-05 account record; not published on bast.ai (the homepage has a "Lucid Therapeutics Demo" video only). Gate B1 in `docs/proposals/2026-09-05-noviant-geo-drop-review.md`; `scripts/check.mjs` blocks the name on the zero-tolerance frame until approved. |
| Peter Rudden is a Co-Founder and Board Member of Bast. | Draft | Beth | Surfaced by Noviant NEXUS from LinkedIn (linkedin.com/in/peterrudden) on 2026-09-05; not on the site or Beth's CV. Gate B2: confirm role and title before a /team/ entry. |
| Bast AI is not affiliated with Bastio. | Draft | Beth | Noviant SHIELD (2026-09-05) reports AI engines conflating Bast.ai with Bastio as well as Vast.ai. Gate B3: one clause on /faq/ and llms.txt once confirmed. |
| github.com/bast-ai is Bast's official GitHub organization. | Verified | Phil | Checked 2026-09-05: org "Bast AI", website bast.ai, contact thanh@bast.ai, public repos incl. this site. Added to Organization `sameAs` and llms.txt. |

## Analytics Claim

The site says GA4 is off until the visitor chooses "Allow analytics." This must
stay true in code. The consent script must not fetch `googletagmanager.com`
before opt-in.

## BastCare publication gate

Beth approved publication of the BastCare pages on August 2, 2026. Known gaps,
including full account deletion, remain stated plainly rather than being
presented as live. The launch includes the existing Bast GA4 configuration and
consent verification; analytics remain content-free and off until the visitor
chooses to allow them.
