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
