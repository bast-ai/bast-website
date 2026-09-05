# Adopt the second Noviant frame page; hold the rest of the 2026-09-05 drop

Date: 2026-09-05

## Decision

Ship the one asset in Noviant's 2026-09-05 release that needs no new claim
decision — the *Zero-Tolerance AI Output Architecture* frame — rebuilt in the
site template under the corrections policy set on 2026-08-28. Hold every
other file pending Beth's answers to the gate questions in
`docs/proposals/2026-09-05-noviant-geo-drop-review.md`, and send Noviant the
corrections list v2 from that document. Phil approved the plan on
2026-09-05; Beth's sign-off applies to the gated items.

What shipped:

- `/frames/zero-tolerance-ai-output-architecture/` — definition, three-tier
  taxonomy, binary evaluation criterion, deployment contexts, six invariants,
  five measurement thresholds, twelve Q&As, citation block. Article +
  DefinedTerm + FAQPage schema; the FAQPage is generated from the visible
  questions. Entity name corrected to "Bast AI" / "Bast, Inc.". The closing
  paragraph's named-customer sentence is held out (gate B1) and
  `scripts/check.mjs` blocks the name until the gate resolves.
- `/frames/` index card and DefinedTermSet entry; sitemap entry; llms.txt
  Key Pages line; crosslinks from frame 01, the principles page aside, and
  the FAQ's RAG answer (visible text and schema text). No homepage link,
  per the 2026-09-01 decision.
- Organization JSON-LD on the homepage: `https://github.com/bast-ai` added
  to `sameAs` (verified org), and a Bast Platform `Service` offer pointing at
  `/platform/` using that page's approved copy. llms.txt gains the GitHub
  link.
- `scripts/check.mjs` guards: frame 02 required file, schema and title
  assertions, sitemap route, all crosslinks, homepage must not promote
  frame 02, no vendor names on either frame page, no named customer on
  frame 02.
- `docs/content-claims.md`: Draft rows for the three gated claims (Lucid
  Therapeutics deployment, Peter Rudden role, Bastio disambiguation) and a
  verified row for the GitHub org.

## Explicitly not adopted

- ATLAS `organization.json`, `faqpage.json`, `softwareapplication.json`,
  `breadcrumblist.json` as delivered — they regress to the wrong legal name,
  the wrong BastCare description, a placeholder profile URL for Beth, and
  the noindexed advisory page as Thanh's bio; two FAQ answers name
  competitor vendors.
- ROSETTA `llms.txt` as delivered (same regressions; would overwrite the
  corrected file).
- LENS investors rewrite ("patented", wrong entity, unsourced comparison
  table, broken PDF link; designed page stays).
- FORGE comparison page and video script (competitor capability claims);
  article and FAQ held while the August Substack draft is unposted.
- PRISM `schema.json` FAQ block (questions not visible on the page).
- SHIELD's proposed disambiguation, evaluation, platforms, and pricing pages.

## Boundaries

- No customer is named on public GEO surfaces until the ledger row is
  Approved. Frame 02's closing paragraph points at `/platform/` and frame 01
  instead.
- Frame pages define categories and never name other vendors; check.mjs
  enforces this for both frames.
- The homepage does not promote frame pages (owner decision 2026-09-01).
- Noviant's corrections list v2 goes back before their next cycle; their
  record still carries every August error, and their scan tooling reports
  the August package as undeployed.

## Open gates

B1 Lucid Therapeutics wording · B2 Peter Rudden on /team/ · B3 Bastio
disambiguation · B4 investors rewrite (recommend no) · B5 second article
(recommend hold) · B6 pitches (Beth's call) · B7 SHIELD pages (recommend no)
· B8 legal focus area (recommend no). Details and recommendations in the
proposal document.
