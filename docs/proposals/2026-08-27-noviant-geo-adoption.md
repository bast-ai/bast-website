# Noviant GEO drop — review and adoption proposal

Date: 2026-08-27
Status: PROPOSAL — nothing in this document has been applied to `src/`.
Source: Noviant release 2026-08-27 (24 files, 9 agents), Drive folder
`1eBJyP25lUTU6I4NxKFpbSoHfcTH74JRE`.
Sign-off owner: Beth (per CLAUDE.md: human sign-off for material positioning
and public claims).
Decision log (2026-08-28, all seven gates resolved via Phil):
1. Legal entity: **Bast, Inc.** ("Bast AI" stays the brand name).
2. Public contact for GEO surfaces: **beth@bast.ai**.
3. "5 patents filed": **confirmed** — ledger row moved to Approved.
4. OEDIT grant: **verified** against OEDIT's May 16, 2024 announcement
   ($250,000 Early-Stage Capital and Retention grant to "Bast, Inc.").
5. Competitor comparison table: **cut**.
6. Team page: **approved**; Thanh Lam LinkedIn supplied.
7. Article venue: **Substack** (Beth posts; edited draft staged).

APPLIED 2026-08-28 — see `docs/decisions/2026-08-28-adopt-noviant-geo-layer.md`
for what shipped. This document remains the review record.

---

## Verdict in three lines

1. **The entity/structured-data layer is worth deploying** — but not as-is.
   Three of Noviant's "authoritative" files materially misdescribe BastCare
   as a clinician-facing hallucination-interception layer. BastCare is a
   consent-first patient/caregiver visit-summary iPhone app ("not a medical
   device"). Every BastCare description must be corrected before anything
   ships.
2. **The content layer needs the repo's own evidence gate.** The fact-drop
   article amplifies claims the ledger (`docs/content-claims.md`) still lists
   as Draft ("5 patents"), introduces one it doesn't contain at all (OEDIT
   grant 2024), asserts unsourced capability claims about seven named
   competitors, and tells hospital buyers "trust 100% of the time is
   achievable" — which contradicts Bast's own refusal-first honesty posture.
3. **Nothing from the July 2026-07-19 drop was ever deployed.** Noviant's
   changelog marks 12 files "already live." The repo has no llms.txt, no
   frame pages, no Noviant JSON-LD. Their next scan will measure lift that
   cannot exist. Tell them, and re-request the July files (they are not in
   the August folder).

## Current GEO state of the site (what exists today)

| Surface | Status |
|---|---|
| Organization JSON-LD | Homepage only — solid: real founder URLs (`linkedin.com/in/brudden`, `bethrudden.ai`), LinkedIn + Substack sameAs. Better founder data than Noviant's files (whose Beth `sameAs` is a literal placeholder `https://www.linkedin.com`). |
| llms.txt | Missing |
| FAQPage / visible FAQ | Missing |
| SoftwareApplication (BastCare) | Missing |
| BreadcrumbList | Missing |
| Expert/team pages | Missing — Thanh Lam appears **nowhere** on the public site; `/advisory/` (which Noviant's pitch cites as his bio) is `noindex, nofollow` by design and never mentions him |
| Sitemap / robots | Present, clean; advisory correctly excluded; careteam invite correctly excluded |
| Citable proof | Strongest evidence (Maryville, DVC, narrative) lives in PDFs — weak surfaces for AI citation; only DVC has an external HTML page |
| Category content | None — the queries Noviant probes ("AI hallucination prevention platform", "AI guardrail software") have no on-domain answer today |

The gap analysis behind Noviant's plan is broadly correct. The execution
files need the corrections below.

---

## Tier 1 — Deploy after named fixes (invisible to readers; schema/nav only)

### 1a. Organization JSON-LD (`entity/schema/organization.json`)
**Merge into the existing homepage block — do not replace it.** Keep the
current founder node (its URLs are correct). Take from Noviant: Denver
`foundingLocation`, `employee` array (Beth + Thanh with `knowsAbout`),
`knowsAbout` topic list, YouTube + Crunchbase in `sameAs`.

Blocking decisions for Beth:
- ~~**`legalName`**~~ **RESOLVED 2026-08-28: "Bast, Inc."** (the privacy page
  was right). Noviant's record and every artifact's prose say "Bast AI, Inc."
  — correct the account record; in adapted content, use the brand "Bast AI"
  in prose and "Bast, Inc." only where the legal entity is meant.
- **`contactPoint` email** — Noviant uses `beth@bast.ai` in every file; the
  site publishes only `community@bast.ai`. Pick one deliberately.
- **Thanh's `sameAs`** — Noviant provides none. Get his LinkedIn URL or ship
  him without one.
- **BastCare offer description** — replace Noviant's text (see Tier 2b).

Draft merged block: Appendix A.

### 1b. llms.txt (`entity/llms.txt`)
Deploy at `src/llms.txt` (build copies it to the web root next to
robots.txt; `.txt` passes through the placeholder pipeline harmlessly).
Required edits first:
- Rewrite both BastCare bullets and the "Healthcare AI reliability" focus
  area — they describe the clinician-interception product that doesn't
  exist. Corrected draft: Appendix B.
- The line calling `/bastcare/architecture/` "the primary fact-dense page
  for AI guardrail and output-validation queries" is wrong — that page
  documents the app's privacy boundaries. Point guardrail queries at the
  homepage `#how` section and (once live) the frame page.
- Fix `Bast AI, Inc..` double-period typo; align contact email with 1a.

### 1c. BreadcrumbList (`entity/schema/breadcrumblist.json`)
Low risk. Target `/bastcare/architecture/` as the implementation guide says.
Align the Organization `name` with the 1a decision. Fine to extend to the
other `/bastcare/*` pages later.

## Tier 2 — Deploy after adaptation + Beth review (new/changed public surface)

### 2a. Frame page (`frames/claim-level-source-grounding/`)
The strongest deployable content in the drop: a DefinedTerm page for a
category query no competitor owns. But Noviant's `index.html` is a
standalone page with its own styling — no site header/footer, no analytics
consent, no `__ROBOTS_META__`/`__SITE_URL__` placeholders. **Rebuild the
content inside the site template** at `/frames/claim-level-source-grounding/`
(keep their URL — their schema, sitemap entry, and llms.txt addition all
reference it), keeping every heading per their guidance.

- Embed their `schema.json` (Article + DefinedTerm + FAQPage) in the head;
  fix Organization `name` "Bast.ai" → "Bast AI"; replace "Bast AI, Inc."
  prose with the brand name ("Bast, Inc." only where the legal entity is
  meant).
- Review the two clinical/legal FAQ answers so they describe the
  architecture generically, never implying named deployments.
- Crosslinks (their snippet) on two pages: homepage `#how` section and the
  principles page. `check.mjs` validates internal links, so page and links
  land in the same PR.
- Append their block to `sitemap.xml`; append their lines to llms.txt.
- **July's companion frame** (`pre-delivery-ai-output-interception`) was
  never deployed and isn't in this folder — request re-delivery and ship
  both together as `/frames/`.

### 2b. SoftwareApplication schema (`entity/schema/softwareapplication.json`)
**Do not deploy Noviant's version.** Its description — "intercepts
AI-generated outputs before they reach clinicians, validating each answer
against approved clinical knowledge" — is not BastCare; it also sets
`operatingSystem: "Cloud"` for an iPhone app. A wrong machine-readable
product description on a page that carefully says "not a medical device"
is a real regulatory-adjacent risk, not a nitpick.

Corrected draft (patient-facing description, `operatingSystem: iOS`,
free-app `offers` block satisfying Google's rich-result requirement using
the already-approved "BastCare 1.0 is free" claim, screen asset as `image`):
Appendix C. Skip `aggregateRating` while the count is 2 ratings.

### 2c. Visible FAQ + regenerated FAQPage schema (`entity/schema/faqpage.json`)
**Do not deploy Noviant's faqpage.json as-is.** Four independent problems:
its own implementation guide says it belongs on `/bastcare/architecture/`
while the JSON targets the homepage; several answers repeat the BastCare
mischaracterization; answers embed capability claims about seven named
competitors; and FAQ schema for questions not visible on the page violates
Google's FAQ policy.

Proposal: build a **visible** FAQ (new `/faq/` page or homepage section),
anchored by the Vast.ai disambiguation — SHIELD's one CRITICAL finding
(engines attribute Vast.ai's complaints to Bast) — plus 4–6 questions whose
answers use only ledger-approved claims. Then generate FAQPage JSON-LD from
what the page actually says. Draft disambiguation copy: Appendix D.

### 2d. Team page with Person schema (NEXUS `experts/`)
The gap is real: engines can't connect Thanh Lam to Bast at all. Propose a
`/team/` page (or an About section): bio, title, photo, Person JSON-LD with
real `sameAs` (Beth: `bethrudden.ai`, `linkedin.com/in/brudden`; Thanh:
URL needed). This also gives the pitch packet a working bio link — it
currently points at the noindexed `/advisory/` page, which never mentions
him.

## Tier 3 — Hold for sign-off, substantial edit, or off-site handling

### 3a. FORGE fact-drop (article + FAQ + comparison + video script)
Genuinely good architecture explainer; four gates before any of it publishes:

1. **"5 filed patents"** (stated 8+ times) — matches investors.html, but the
   ledger row is **Draft** pending Beth/Legal. Amplifying a Draft claim into
   machine-readable content raises its exposure; resolve the row first.
2. **OEDIT Early-Stage Capital and Retention Grant (2024)** — not in the
   ledger. Verify against OEDIT's own announcement (the cited source is
   Bast's LinkedIn post), add a ledger row, then it's a strong, usable fact.
3. **Competitor table** (`compare.md`) asserts specific incapabilities of
   OpenAI, Anthropic, Guardrails AI, Arthur AI, Galileo, Fiddler AI (and the
   FAQ adds Arize, LangChain, LexisNexis) with **no sources** — the report's
   source list is entirely self-referential. Repo principle: public claims
   traceable to evidence. Publish only after owner/legal review, or cut the
   table and keep the category taxonomy.
4. **"'Trust 100% of the time' is achievable"** (faq.md) — an overclaim the
   site itself would refuse. Rewrite in house voice: *when Bast can't ground
   an answer, it refuses — that's the guarantee.*

Venue: the site has no blog. Either a `/research/` page on-site (best for
GEO: their checklist wants on-domain URLs) or Substack (SHIELD notes it's a
high-citation source; also fine). Recommendation: on-site for the edited
article; Substack for the identity/announcement angle.

### 3b. LENS principles rewrite (`rewrites/principles-html/rewritten.md`)
**Recommend against replacing the live page.** The current page is a
designed, voice-consistent piece; the rewrite injects vendor-comparison
tables, "Bast as an AI Guardrail Vendor" headers, and contact CTAs into a
philosophy page — and it would break `check.mjs`, which asserts exact
snippets ("Nature runs on sunlight." etc.) the rewrite drops.

Harvest instead: its "What These Terms Mean" definitions block is strong —
move it to the frame page or FAQ; its comparison table belongs with 3a; its
FAQ items feed 2c. If principles.html needs GEO help, add non-visible
Article JSON-LD without touching copy. (Same treatment for July's
undeployed homepage rewrite.)

### 3c. NEXUS pitch packet — off-site, comms-owned
Before sending anything:
- Fix bio links (Thanh → noindexed advisory page; Beth → placeholder
  `https://www.linkedin.com`).
- Verify the "Masters of Scale podcast" appearance before it goes in an
  email to an editor.
- Judgment call for Beth: all four target "outlets" (galileo.ai,
  getmaxim.ai, futureagi.com, superprompt.com) are **rival vendors' SEO
  blogs** — Galileo appears in Noviant's own comparison table as a
  competitor. Perplexity does cite them, but pitching Bast's CTO to a
  competitor's content team is a strategy question, not a mail-merge task.

### 3d. SHIELD/SCOUT off-site actions (no repo changes)
Worth doing, in order: Google Business Profile (address exists on the
privacy page); Wikidata item (easy, legitimate); G2/Capterra vendor profile
(kills the fabricated-review pattern); Wikipedia only if independent
coverage supports notability — a promotional article would backfire.
Also: convert Maryville + DVC proof into crawlable HTML case-study pages;
PDFs are weak citation surfaces.

---

## Corrections to send Noviant (their worksheet: corrections become verified account facts)

1. **BastCare** is a free, consent-first iPhone app for patients and
   caregivers — visit recording, plain-language summary, CareTeam sharing;
   not a medical device; model provider OpenAI. It is **not** a
   clinician-facing output-interception layer. (Affects llms.txt,
   softwareapplication.json, faqpage.json, fact-drop FAQ.)
2. Legal entity is **"Bast, Inc."** (confirmed 2026-08-28). Their account
   record — including SHIELD's "confirmed fact anchor" — says "Bast AI,
   Inc.", which is wrong. Correct the record; "Bast AI" stays as the brand
   name in prose.
3. Beth's profile URLs: `https://www.linkedin.com/in/brudden` and
   `https://bethrudden.ai/` (their record holds a bare `linkedin.com`).
4. Thanh Lam has no public bio page; `/advisory/` is noindexed and doesn't
   mention him. Real URL to follow once the team page ships.
5. Published contact is `community@bast.ai`, not `beth@bast.ai` (unless
   Beth decides otherwise).
6. The 2026-07-19 drop was never deployed; "already live" tracking is wrong.
   Re-deliver the July files.
7. "5 patents" wording is pending internal legal confirmation; hold it out
   of new deliverables until confirmed.

## Claim verification table

| Claim | Where Noviant uses it | Site today | Ledger | Gate |
|---|---|---|---|---|
| 5 filed patents | fact-drop ×8, FAQ, compare, video | investors.html: "5 patents" | **Draft** | Beth/Legal confirm before amplification |
| OEDIT grant 2024 | fact-drop, FAQ, compare, video | absent | **absent** | Verify OEDIT primary source; add ledger row |
| BastCare = clinical interception layer | llms.txt, softwareapplication, faqpage | contradicts /bastcare/ + architecture page | contradicts approved rows | Correct before any deploy |
| "Trust 100% achievable" | fact-drop FAQ | contradicts refusal-first posture | n/a | Rewrite |
| Competitor incapabilities (7+ vendors) | compare.md, FAQs | none | none | Owner/legal review or cut |
| Legal name "Bast AI, Inc." | all entity files | privacy page: "Bast, Inc." | n/a | **Resolved: Bast, Inc.** — correct Noviant's record and artifact prose |
| Beth on Masters of Scale | pitch packet | n/a | absent | Verify episode before outreach |
| Denver HQ | entity files | privacy page address | consistent | OK |
| sameAs profiles (LI/CB/YT/Substack) | sameAs.json | LI/YT/Substack linked on site | consistent | Manually verify Crunchbase URL (their own check got HTTP 403) |

## Proposed implementation sequence (each PR-sized, after sign-off)

1. **PR 1 — invisible schema layer:** merged Organization JSON-LD,
   corrected llms.txt, BreadcrumbList on architecture page, corrected
   SoftwareApplication on /bastcare/. Add the new files to `check.mjs`
   required list. Zero visible copy changes.
2. **PR 2 — frame pages:** both frames in site template + crosslinks +
   sitemap + llms.txt additions.
3. **PR 3 — visible FAQ** (Vast.ai disambiguation first) + matching
   FAQPage schema.
4. **PR 4 — team page** + Person schema; then update Noviant + pitch bios.
5. **PR 5 (optional) — research article** after claim gates clear.
6. Off-site queue: GBP, Wikidata, G2/Capterra, Substack identity post,
   pitches (post-review).
7. Send the corrections list to Noviant; update `docs/content-claims.md`
   (OEDIT row, patents row resolution, competitor-claims policy); add a
   `docs/decisions/` note when adopted (this touches positioning and
   public claims).

---

## Appendix A — Draft merged Organization JSON-LD (homepage)

Decisions marked `TODO`. Everything else uses verified values.

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://www.bast.ai/#organization",
  "name": "Bast AI",
  "legalName": "Bast, Inc.",
  "alternateName": "Bast",
  "url": "https://www.bast.ai/",
  "logo": "https://www.bast.ai/assets/bast-logo.svg",
  "description": "Bast AI builds explainable healthcare AI infrastructure: ontology-grounded answers that trace to approved knowledge and source evidence, with the provenance and AI governance healthcare institutions need.",
  "foundingLocation": {
    "@type": "Place",
    "address": { "@type": "PostalAddress", "addressLocality": "Denver", "addressRegion": "CO", "addressCountry": "US" }
  },
  "sameAs": [
    "https://www.linkedin.com/company/bast-ai/",
    "https://bastai.substack.com",
    "https://www.youtube.com/@Bast_CAT22",
    "https://www.crunchbase.com/organization/bast-ai"
  ],
  "founder": {
    "@type": "Person",
    "name": "Beth Rudden",
    "jobTitle": "CEO",
    "url": "https://bethrudden.ai/",
    "sameAs": ["https://linkedin.com/in/brudden", "https://bethrudden.ai/cv.html"],
    "knowsAbout": ["Artificial Intelligence", "Machine Learning", "Data Strategy"]
  },
  "employee": [
    {
      "@type": "Person",
      "name": "Thanh Lam",
      "jobTitle": "CTO",
      "knowsAbout": ["AI architecture", "source-grounded AI", "AI explainability systems", "AI verification layers", "conversational AI design", "AI guardrails"],
      "sameAs": ["TODO — Thanh's LinkedIn URL"]
    }
  ],
  "contactPoint": [{ "@type": "ContactPoint", "email": "TODO — community@bast.ai (site standard) or beth@bast.ai", "contactType": "customer support" }],
  "knowsAbout": ["AI hallucination prevention", "AI guardrails", "explainable AI", "source-grounded AI", "AI verification layers", "healthcare AI infrastructure", "AI output validation", "trusted AI systems"],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Bast AI Products and Services",
    "itemListElement": [{
      "@type": "Offer",
      "itemOffered": {
        "@type": "SoftwareApplication",
        "name": "BastCare",
        "url": "https://www.bast.ai/bastcare/",
        "applicationCategory": "HealthApplication",
        "operatingSystem": "iOS",
        "description": "BastCare is a free iPhone app for patients and caregivers: record a medical visit with everyone's permission, receive a plain-language summary, and choose exactly what a chosen CareTeam can see. BastCare is an organization and communication tool, not a medical device."
      }
    }]
  }
}
```

## Appendix B — Corrected llms.txt lines (deltas from Noviant's file)

Replace the BastCare-related lines with:

```markdown
- [BastCare](https://www.bast.ai/bastcare/): Free iPhone app for patients
  and caregivers — record a visit with everyone's permission, receive a
  plain-language summary, and choose exactly what a chosen CareTeam can
  see. Not a medical device.
- [How BastCare Works](https://www.bast.ai/bastcare/architecture/):
  Plain-language architecture of BastCare's privacy boundaries — what stays
  on the iPhone, what is processed temporarily, what is deleted, and how
  account deletion works.
```

Replace the "Healthcare AI reliability" focus area with:

```markdown
- Healthcare AI reliability: The Bast platform grounds institutional AI
  answers in approved clinical knowledge with per-answer provenance;
  BastCare brings plain-language, consent-first visit summaries to patients
  and caregivers.
```

Also: change the header `# Bast AI, Inc.` to `# Bast AI` and add a line
`Legal entity: Bast, Inc.` (this also removes the `Inc..` typo); set the
contact line to the decided email; point "AI guardrail" queries at
`https://www.bast.ai/#how` until the frame page is live.

## Appendix C — Corrected SoftwareApplication JSON-LD (/bastcare/)

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": "https://www.bast.ai/bastcare/#software",
  "name": "BastCare",
  "url": "https://www.bast.ai/bastcare/",
  "applicationCategory": "HealthApplication",
  "operatingSystem": "iOS",
  "description": "BastCare is a free iPhone app from Bast AI for patients and caregivers. Record a medical visit with everyone's permission, receive a plain-language summary, and decide exactly what your CareTeam can see. Audio stays on the iPhone until the summary is created, and Bast does not save or log transcript text. BastCare is an organization and communication tool, not a medical device.",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "image": "https://www.bast.ai/assets/bastcare/screens/home.webp",
  "installUrl": "https://apps.apple.com/app/id6789669565",
  "featureList": [
    "Consent-first visit recording",
    "Audio stays on the iPhone until the summary is created",
    "Plain-language visit summaries",
    "CareTeam sharing with preview and revocation",
    "Sharing nothing is always valid",
    "Full account deletion"
  ],
  "provider": { "@id": "https://www.bast.ai/#organization" }
}
```

## Appendix D — Draft visible FAQ entry (Vast.ai disambiguation)

> **Is Bast AI affiliated with Vast.ai?**
> No. Bast AI (bast.ai) and Vast.ai are different, unrelated companies.
> Bast AI builds explainable AI infrastructure for healthcare: every answer
> traces to approved sources, and the system refuses when nothing supports
> a reply. Vast.ai is a GPU cloud marketplace. Reviews or complaints about
> Vast.ai do not describe Bast AI.

Candidate companions (answers restricted to ledger-approved claims): "What
is Bast AI?", "What is BastCare?", "Is BastCare free?", "Is BastCare a
medical device?", "How is Bast different from RAG?" — final wording with
Beth.
