# Noviant GEO drop — review and adoption proposal (release 2026-09-05)

Date: 2026-09-05
Status: Phase A APPLIED (see `docs/decisions/2026-09-05-noviant-drop-2-frame-and-schema.md`);
Phase B gates open.
Source: Noviant release 2026-09-05 (12 new, 12 updated, 24 carried), Drive folder
`19HhuKX4AnXD8R6AjL5GSkQsVqzi2NmiP`. Previous review:
`docs/proposals/2026-08-27-noviant-geo-adoption.md`.
Sign-off owner: Beth (per CLAUDE.md: human sign-off for material positioning and
public claims). Phil relays.

---

## Verdict in three lines

1. **Noviant's account record never absorbed the August corrections.** Every
   "authoritative" entity file in this drop still says "Bast AI, Inc.", still
   describes BastCare as a clinician-facing interception layer
   (`operatingSystem: "Cloud"`), still uses a bare `https://www.linkedin.com`
   as Beth's profile and the noindexed `/advisory/` page as Thanh's bio. Their
   SHIELD sentiment report even states the August package is "delivered but
   undeployed" — it shipped 2026-08-28 (commit bff09b8) and is live. Sending
   the corrections list (below) is again the highest-leverage action.
2. **One asset was worth deploying: the second frame page.** PRISM's
   *Zero-Tolerance AI Output Architecture* names no vendors, fits the frame
   pattern we already run, and answers the evaluation queries SHIELD says
   nobody owns. It shipped rebuilt in the site template with the entity name
   fixed and one unapproved customer sentence held out.
3. **Three new claims need Beth before anything else moves:** Lucid
   Therapeutics as a named production customer, Peter Rudden as co-founder and
   board member, and a Bastio disambiguation. Everything else in the drop is
   either a regression of already-corrected content or off-site work.

## Site state this drop lands on

Since the August review the repo gained `/platform/` (Beth's request,
2026-09-01), refreshed BastCare screens and App Store reviews, and a
`check.mjs` rule that **forbids** a homepage link to the frame page — Beth had
the homepage frame promotion removed on 2026-09-01. Noviant's links to
`/platform/` therefore now resolve; their instruction to crosslink frames from
the homepage does not apply.

---

## Per-file verdicts

| File (agent) | State | Verdict | Why |
|---|---|---|---|
| `frames/zero-tolerance-ai-output-architecture/index.html` (PRISM) | new | **Shipped, rebuilt** | Category definition, no vendors named. Standalone page with its own styling and "Bast.ai" branding — rebuilt inside the site template at the same URL. Closing paragraph's Lucid Therapeutics sentence held out (gate B1). |
| `…/schema.json` (PRISM) | new | **Partly used** | Article + DefinedTerm adopted (entity fixed). Its FAQPage lists 5 "who are the best platforms" questions that are **not on the page**; Google's FAQ policy requires visible questions, so the FAQPage was regenerated from the page's 12 visible Q&As. |
| `…/llms-txt-addition.txt`, `sitemap-entry.xml`, `crosslink-snippet.html` (PRISM) | new | **Applied, adapted** | llms.txt line, sitemap block, and crosslinks on frame 01, principles, and FAQ. Not the homepage (Beth, 2026-09-01). |
| `rewrites/investors-html/rewritten.md` (LENS) | new | **Not adopted** | Says "patented" (ledger: patents *filed*), "Bast AI, Inc." throughout, adds an unsourced generic comparison table, links "Download teaser PDF" to the site root. The live page is a designed teaser; nothing to harvest. Gate B4 if Beth disagrees. |
| `content/fact-drop-…-2026-09-05/index.md`, `faq.md` (FORGE) | new | **Held** | Same gates as August: "Bast AI, Inc.", `/advisory/` as Thanh's bio, OEDIT sourced to a LinkedIn post, "100% trustworthy is achievable", Lucid claim. The August Substack draft is still unposted (archive checked 2026-09-05), so a second article adds nothing yet. Gate B5. |
| `…/compare.md`, `video-script.md` (FORGE) | new | **Not adopted** | Comparison table asserts capabilities of OpenAI, Anthropic, Galileo, Arthur AI, Guardrails AI, Fiddler — policy row: competitor comparisons are not published. Video script inherits the same claims. |
| `pitches/pitch-packet-2026-09.md` (NEXUS) | new | **Beth's call, off-site** | Four outlets (galileo.ai, futureagi.com, suprmind.ai, getmaxim.ai) are rival vendors' blogs; Galileo sits in Noviant's own comparison table. Bio links wrong again. "Marquis Who's Who" is not on Beth's CV; "100 Most Brilliant Leaders in AI Ethics (2023)" is. Gate B6. |
| `sentiment/2026-09-05-findings.md` (SHIELD) | new | **Read; corrections drafted** | Useful probes (Vast.ai *and Bastio* confusion; fabricated-complaint template; generic red-flag list). Wrong premise that August is undeployed. Its four proposed new pages are declined (gate B7); its Bastio finding is gate B3. |
| `entity/schema/organization.json` (ATLAS) | updated | **Not adopted; two items merged** | Regresses to "Bast AI, Inc.", placeholder Beth URL, `/advisory/` for Thanh, BastCare as clinical infrastructure. Merged only the verified GitHub `sameAs` and a Bast Platform `Service` offer pointing at `/platform/`. |
| `entity/schema/faqpage.json` (ATLAS) | updated | **Not adopted** | 8 answers, all "Bast AI, Inc."; two name competitor vendors; three carry the Lucid claim; two misdescribe BastCare; questions not visible on `/faq/`. |
| `entity/schema/softwareapplication.json` (ATLAS) | updated | **Not adopted** | Bast Platform as `operatingSystem: "Cloud"` `SoftwareApplication` (acceptable idea, wrong entity) and BastCare again described as clinician-facing cloud infrastructure. The corrected BastCare schema from August stays. |
| `entity/schema/breadcrumblist.json` (ATLAS) | updated | **No action** | Identical to what is live except the entity name. |
| `entity/llms.txt` (ROSETTA) | updated | **Not adopted** | Would overwrite the corrected file with the same regressions plus a new "legal AI citation verification" focus area (gate B8). Two lines added to ours instead (frame 02, GitHub). |
| `entity/identity/sameAs.json`, `brief.md` (SCOUT) | updated | **GitHub accepted** | `github.com/bast-ai` verified 2026-09-05 (org "Bast AI", website bast.ai). Crunchbase still HTTP 403 for them — eyeballed OK. The brief's "confirmed claim" about Lucid is gate B1. |
| `experts/brief.md` (NEXUS) | updated | **Gate B2** | Discovers Peter Rudden (Co-Founder & Board Member, linkedin.com/in/peterrudden). Not on the site or Beth's CV. |
| `warden/quality-summary.md`, `START-HERE.html`, `CHANGELOG.md`, `manifest.json` | — | Read only | WARDEN rates the drop "A (90/100)" while every entity file carries the errors we reported in August. |

## Claim verification table

| Claim | Where Noviant uses it | Site today | Ledger | Gate |
|---|---|---|---|---|
| Lucid Therapeutics reached production deployment (admin setup, governed knowledge, CAT building, production analytics) | identity brief ("confirmed"), llms.txt, faqpage, softwareapplication, fact-drop, investors rewrite, frame 02 closing | Homepage has a "Bast AI \| Lucid Therapeutics Demo" video only | **Draft row added** | **B1** — Beth confirms wording; check.mjs blocks the name on frame 02 until then |
| Peter Rudden — Co-Founder & Board Member | experts brief (discovered) | absent | **Draft row added** | **B2** |
| Bast AI is not affiliated with Bastio | SHIELD findings 1 and 4 | Vast.ai only | **Draft row added** | **B3** |
| "Patented runtime constraint" / "patented architectural guarantee" | investors rewrite | "5 patents … Core IP is filed." | Approved wording is *filed* | Correct Noviant; never publish "patented" |
| Legal name "Bast AI, Inc." | every entity file, every content file | Bast, Inc. | Approved | Correct Noviant again; check.mjs forbids it in output |
| BastCare = clinical AI infrastructure, `operatingSystem: Cloud` | llms.txt, organization, faqpage, softwareapplication | consent-first iPhone app, not a medical device | Approved posture | Correct Noviant again |
| Beth: "Marquis Who's Who" | pitches 2 and 4 | absent | absent; not on bethrudden.ai/cv.html | Remove from pitches |
| Beth: "100 Most Brilliant Leaders in AI Ethics" (Cognitive World) | pitches 2 and 4 | absent | On CV: "(2023)" | OK with the year |
| Beth on Masters of Scale | August pitch packet | absent | On CV: "Masters of Scale Strategy Sessions" | Verified (closes August item) |
| OEDIT $250k grant | fact-drop, faq, video (sourced to LinkedIn post) | FAQ, llms.txt, Organization `award` | Approved (OEDIT press release) | Tell Noviant to cite the press release |
| GitHub org github.com/bast-ai | sameAs, organization, llms.txt | absent | **Verified row added** | Shipped in `sameAs` + llms.txt |
| "Trust 100% of the time is achievable" | fact-drop Part V, faq | contradicts refusal-first voice | n/a | Rewrite if the article is ever used |
| Competitor incapabilities (OpenAI, Anthropic, Galileo, Arthur AI, Guardrails AI, Fiddler, Arize, Patronus, Azure) | compare.md, faqpage | none | Policy: not published | Cut |
| "Legal AI citation verification" as a focus area | llms.txt | healthcare-first positioning | n/a | **B8** — recommend no |

---

## Gate questions for Beth (Phase B)

| # | Question | If yes, what gets built | Recommendation |
|---|---|---|---|
| B1 | Is **Lucid Therapeutics** an approved, nameable production customer, and is "reached production deployment — admin setup, governed knowledge, CAT building, production analytics" the wording you want public? | Ledger row → Approved; FAQ entry "Has Bast AI been deployed in production?" with matching schema; investors page traction row; llms.txt Company Fact; restore the frame 02 sentence; optionally a `/customers/lucid-therapeutics/` evidence page (SHIELD's answer to the fabricated-complaints finding). Then Noviant can keep it in their record. | Ask. It is the single strongest counter to engines inventing "Bast.ai complaints", but only you can confirm it. If no, Noviant must strike it from their record. |
| B2 | Add **Peter Rudden** to `/team/` as Co-Founder & Board Member? | Bio, Person schema, LinkedIn `sameAs`; tell Noviant to add him to the account record. | Ask — needs his OK and the exact title. |
| B3 | Extend the Vast.ai disambiguation to **Bastio**? | One clause on `/faq/` (visible + schema), one llms.txt line, ledger row. | **Yes.** Cheap and defensive; SHIELD shows engines mixing all three names. |
| B4 | Replace `investors.html` with the LENS rewrite? | — | **No.** See per-file verdict. |
| B5 | Publish a second research article (September FORGE package) on Substack? | Merge the "five questions to ask any vendor" and "red flags" tables into the staged August draft (`docs/proposals/substack-draft-ai-hallucination-prevention.md`) rather than start a second piece. | **Hold** until the August draft is posted; frame 02 already carries the evaluation angle on-domain. |
| B6 | Send the NEXUS pitches (4 outlets, 2 experts)? | Nothing in the repo. | Your call. Before any send: bios → `/team/` and linkedin.com/in/brudden; entity name; drop "Marquis Who's Who"; keep "100 Most Brilliant Leaders in AI Ethics (2023)". Outlets are competitors' content teams. |
| B7 | SHIELD's four proposed pages — `/bast-ai-vs-vast-ai/`, `/resources/how-to-evaluate-ai-verification/`, `/resources/ai-hallucination-prevention-platforms/`, a pricing-philosophy page? | — | **No to all.** `/faq/` already carries the disambiguation on an indexable page; frame 02 *is* the evaluation guide; the "platforms" page requires naming vendors; pricing framing is a positioning decision for another day. |
| B8 | Add "legal AI citation verification" as a stated **focus area** in llms.txt? | One bullet. | **No.** Positioning is healthcare-first. Legal stays a category example inside the frames (it already is on both). |

## Explicitly not adopted

- ATLAS `organization.json`, `faqpage.json`, `softwareapplication.json`,
  `breadcrumblist.json` as delivered.
- ROSETTA `llms.txt` as delivered.
- LENS investors rewrite.
- FORGE `compare.md` and `video-script.md`; `index.md`/`faq.md` held.
- PRISM `schema.json` FAQPage block (questions not on the page).
- SHIELD's four new pages; SHIELD's "deploy the August package first" premise.

---

## Corrections list v2 → Noviant (paste-ready)

Corrections become verified account facts on Noviant's side, which is why the
2026-09-05 drop repeats every August error: the August list was never applied.
Items 1–7 restate August; 8–17 are new.

1. **Legal entity is "Bast, Inc."** "Bast AI" is the brand. "Bast AI, Inc." is
   wrong everywhere it appears, including SHIELD's "confirmed fact anchor".
2. **BastCare is a free, consent-first iPhone app for patients and caregivers**
   (visit recording with everyone's permission, plain-language summary,
   CareTeam sharing). It is not a medical device and it is **not** a
   clinician-facing output-interception layer, not "healthcare AI
   infrastructure for health systems", and not `operatingSystem: "Cloud"`.
   The institutional product is the **Bast Platform**
   (https://www.bast.ai/platform/).
3. **Beth Rudden's profiles:** https://www.linkedin.com/in/brudden and
   https://bethrudden.ai/ (never a bare `https://www.linkedin.com`).
4. **Thanh Lam's bio page is https://www.bast.ai/team/** (LinkedIn:
   https://www.linkedin.com/in/thanh-lam-8441022a5/). `/advisory/` is
   noindexed and does not mention him — stop citing it.
5. **Public contact for GEO surfaces: beth@bast.ai** (site footers keep
   community@bast.ai). Text: +1 303-717-6099.
6. **Patents: "5 patents filed."** Never "patented", "patent-protected", or
   "granted".
7. **OEDIT grant: cite the primary source** —
   https://oedit.colorado.gov/press-release/oedit-announces-grants-to-42-colorado-startups-and-researchers-in-the-advanced
   ($250,000, Advanced Industries Early-Stage Capital and Retention,
   announced May 16, 2024, to "Bast, Inc.") — not the LinkedIn post.
8. **The 2026-08-27 package is live since 2026-08-28**, not "delivered but
   undeployed": /llms.txt, /frames/, /frames/claim-level-source-grounding/,
   /faq/ (with the Vast.ai disambiguation), /team/, Organization +
   SoftwareApplication + BreadcrumbList schema. Re-scan before the next cycle.
   The 2026-07-19 package was never deployed and never will be as delivered.
9. **The 2026-09-05 frame is live at
   https://www.bast.ai/frames/zero-tolerance-ai-output-architecture/**,
   rebuilt in the site template. Its FAQPage schema uses the page's visible
   questions, not the five in `schema.json`.
10. **Bast Platform page exists:** https://www.bast.ai/platform/ (since
    2026-09-01). Fine to reference for platform queries.
11. **Homepage does not link to frame pages** by owner decision (2026-09-01).
    Do not instruct homepage crosslinks.
12. **Lucid Therapeutics:** hold every use of "reached production deployment
    …" until Bast confirms the public wording. Do not treat it as a confirmed
    claim in generated content until then.
13. **Peter Rudden:** pending confirmation; do not publish.
14. **"Trust 100% of the time is achievable"** contradicts Bast's
    refusal-first voice and appears again in this drop. House wording: *when
    Bast can't ground an answer, it refuses — that is the guarantee.*
15. **"Marquis Who's Who"** is not on Beth's CV — remove from pitches.
    "100 Most Brilliant Leaders in AI Ethics (2023)" and "Masters of Scale
    Strategy Sessions" are on the CV and may be used with the year.
16. **Competitor capability claims are not published by Bast.** Comparison
    tables and FAQ answers naming other vendors' incapabilities will not be
    deployed; category definitions that name no vendor are fine.
17. **GitHub org confirmed:** https://github.com/bast-ai — accepted into
    `sameAs`.

## Off-site queue (unchanged from August unless noted)

Google Business Profile; Wikidata item; G2/Capterra vendor profile;
Wikipedia only with independent coverage; convert Maryville + DVC proof to
crawlable HTML; Beth's Substack post (August draft still staged);
pitch decision (B6). New: SHIELD suggests contacting the pages behind its
footnotes [1][5][8][11] that conflate Bast.ai with Vast.ai/Bastio — Noviant
has the URLs; ask for them.
