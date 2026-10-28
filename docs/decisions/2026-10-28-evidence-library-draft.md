# Evidence library page (draft)

Date: 2026-10-28
Status: Proposed for Beth's approval. Draft; do not merge until Beth approves.

## Decision

Add `/evidence/`, a draft evidence library: a short intro, five public
preview findings, and the full filterable library of 43 published studies
behind a name-and-email form (a soft gate, not a login).

Data lives in `src/evidence/library.json`, copied verbatim from the Bast
research canvas "Bast AI evidence library: explainability, caregiving, who
pays" (checked October 28, 2026). `studyType` is a filter grouping derived from
the verbatim `designAndSize` text. The canvas's internal notes ("how Beth can
use it") and its pricing-experiment ideas are not in this repo, because the
repo is public.

## Draft guardrails

- Hard-coded `noindex, nofollow`; not in the sitemap, primary nav, footer, or
  `llms.txt`. The hard-coded robots tag also means the build adds no share tags.
- No analytics, cookies, browser storage, or third-party scripts on the page.
  The page does not load `analytics-consent.js`, so it shows no cookie banner.
- The form handler is a stub. It validates name and email, then unlocks the
  library in the current tab and posts nothing anywhere. Reloading locks it.
- The page HTML carries only the five preview findings. The full data is a
  separate same-origin JSON fetched after the form. Anyone who knows the URL
  can still read it; a static site cannot do better without a server.
- `scripts/check.mjs` enforces these rules, checks the five preview numbers and
  links against the data file, and bans internal notes, "free app", Craig
  Hospital, and pricing-experiment wording on the page.

## Decisions for Beth

1. Where form submissions go, and the privacy notice that goes with it.
   Options: a `mailto:` handoff (no storage, but visitors must send it); a Bast
   endpoint on the existing AWS path (Bast holds the data); a hosted form or
   CRM service (fastest, adds a processor to the privacy policy); or no
   capture at all (drop the gate and publish openly).
2. Whether to keep the gate at all. A real gate needs a server; a soft gate
   only signals intent.
3. Going public: remove `noindex`, add to the sitemap and `llms.txt`, and add
   share tags. Add the claims to the private claims ledger first.
4. Nav placement: footer only, a link from `/platform/evidence/`, or the
   primary nav (which `check.mjs` currently fixes at four links).
5. Whether this page loads the site's consent-gated GA4 like other pages.

## Repo-policy note

`CLAUDE.md` says unpublished drafts live in the private `bast-ai/ai-workspace`
repo. This draft is in the public repo at Beth's request so it can be reviewed
as a pull request; the branch and data file are publicly visible on GitHub.
