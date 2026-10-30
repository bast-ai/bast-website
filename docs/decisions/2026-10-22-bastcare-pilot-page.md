# BastCare pilot page for QR visitors

Date: 2026-10-22
Status: Proposed for Beth's approval (CU Anschutz panel, 2026-10-22)

## Decision

Add `/pilot/`, a single-column, mobile-first page matching the BastCare
nonprofit pilot one-pager (v5). Printed QR codes point to
`https://www.bast.ai/pilot/#book`, the hero section. Its first action is
"Book a 30-minute call" (an email to Beth; bast.ai has no booking link). The
App Store link is secondary. The booking call to action repeats near the end of
the page, next to the one-pager PDF.

The page is in the sitemap, so the build adds the standard share tags. It loads
only its own stylesheet and the usual consent-gated analytics.

## Content rules

The page has no prices, no pilot length or license counts, no Craig Hospital
claims, and no transcript or source-tracing claims. The 17% figure is labelled
as published findings, not BastCare results: Levoy K et al., Medical Care
2022;60(7):519-529, 54 RCTs, RR 0.83 (PMID 35679175).

The published PDF
(`assets/bastcare-pilot-one-pager.pdf`) is the approved v5 one-pager. Its
privacy line reads "Audio is deleted once the summary is saved. Bast's servers
don't save the transcript."

Update 2026-10-22: Beth approved revised copy. The page no longer calls
BastCare a free app. Pilot families get free BastCare access during the pilot,
and pilot results are measured with the Zarit Burden Interview.

`scripts/check.mjs` enforces these rules on the page and checks the asset sizes.

Update 2026-10-22 (later): Beth's edits. The page's "Private by design" text is
now the PDF's privacy line, word for word, plus a "Privacy policy" link. The fine print keeps only
the Levoy citation; "Published findings, not BastCare results." and "Pilot
results are measured with the Zarit Burden Interview." are removed.

Update 2026-10-22 (QR): The one-pager PDF now carries a printed booking QR code
beside its "Book a 30-minute call." band, encoding
`https://www.bast.ai/pilot/#book`, with "bast.ai/pilot" under it. No other copy
changed.

Update 2026-10-27 (tagline): Beth's tagline, "Retain more of the conversation,
so you can be present in the room.", replaces the headline "Help your families
keep what the doctor said." on `/pilot/` (h1 and `og:title`) and on the
one-pager PDF (headline only, set at 19 pt so it fits the same box; QR, layout
and other copy unchanged). The home page hero carries the same line beside a
"Start a BastCare pilot" link to `/pilot/`.

Update 2026-10-30 (pilot privacy line and title): On `/pilot/` only, the
"Private by design" paragraph is now: "Audio is deleted once the transcript is
saved. BastCare asks for consent before recording. With each person's consent,
transcripts are kept in your organization's own secure database, so your team
can learn from them. Summaries belong to the user. Your organization owns its
data." Beth Rudden's title on that page is "CEO & Chair".

That sentence says BastCare asks for consent before recording. Do not extend
it to say recording requires consent, waits for consent, or starts only after
consent or agreement. The ask is not an enforcement gate.

`src/assets/bastcare-pilot-one-pager.pdf` is unchanged. It still carries the
older privacy line ("Audio is deleted once the summary is saved. Bast's
servers don't save the transcript. Summaries belong to the user. Your
organization owns its data.") and "Founder + CEO". There is no separate
flyer source in this repo. Consumer privacy pages are unchanged. The private
claims ledger in `bast-ai/ai-workspace` was not reachable from the environment
that made this edit (GitHub returned 403), so this note records the requested
public wording and the limit above.
