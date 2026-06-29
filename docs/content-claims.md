# Public Content Claims

This file keeps the public website honest without adding OpenSpec ceremony.
Each material claim should have an owner and evidence note before production
publish.

| Claim | Status | Owner | Evidence / note |
|---|---|---|---|
| Bast grounds AI in approved knowledge, ontology, and source material. | Draft | Beth | Core product thesis. Tie to platform docs before launch. |
| Every answer can be traced, checked, or refused. | Draft | Beth / Adam | Confirm exact wording against current runtime behavior. |
| Hosted, private cloud, or on prem deployment. | Draft | Beth | Validate against active deployment offers. |
| Relevant knowledge is selected before generation, reducing token load and noise. | Draft | Adam | Confirm compute/token reduction number before publishing any numeric claim. |
| Bast records blocked, missing, or out-of-scope answer paths. | Draft | Adam | Confirm analytics/refusal logging fields before production copy. |
| DVC featured Bast as a medical AI case study with full provenance, reproducible answers, and offline operation. | Draft | Beth | Public DVC blog link is used from homepage outcome teaser. Confirm final wording against DVC page. |
| Maryville University saved $1.2M in the first semester. | Draft | Beth | Investor deck and personal-site public copy use this proof point. Confirm approved public wording before launch. |
| Bast has 5 patents filed. | Draft | Beth / Legal | Used on investor teaser page and source teaser PDF. Confirm approved patent count and wording before launch. |
| Bast has live deployments, paying customers, and healthcare pull. | Draft | Beth | Used as investor teaser framing from the June 2026 teaser PDF. Keep general unless approved names/numbers are added. |

## Analytics Claim

The site says GA4 is off until the visitor chooses "Allow analytics." This must
stay true in code. The consent script must not fetch `googletagmanager.com`
before opt-in.
