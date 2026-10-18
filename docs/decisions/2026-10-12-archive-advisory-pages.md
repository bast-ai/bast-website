# Archive the Bast Advisory pages

Date: 2026-10-12
Owner: Beth
Status: Proposed (Beth's direction 2026-10-12; final sign-off is this PR)

## Decision

The `/advisory/` pages (landing, healthcare, EU AI Act, change adoption) come
off the published site. Their source moves to `archive/advisory/` and stays in
git, but it is not built or deployed: `scripts/build.mjs` copies only `src/`.

Archived with them, because nothing else on the site uses these files:
- `src/assets/advisory.css` and the three advisory one-pager PDFs
  (`bast-healthcare-advisory.pdf`, `bast-eu-ai-act-briefing.pdf`,
  `bast-change-adoption.pdf`)
- `scripts/advisory-pdf.mjs` and `scripts/verify-text.mjs`, which rendered and
  checked those PDFs
- `docs/advisory-pages/`, the page copy text files

`bast-narrative.pdf` and `bast-narrative-cover.png` stay published. Only the
advisory landing page linked to them, but they are not advisory-specific and
may be shared directly.

## Redirect

GitHub Pages has no server-side redirects. `/advisory/` is now a small noindex
stub that says the pages are archived and meta-refreshes to `/` after five
seconds. The old deep pages (`/advisory/healthcare.html` and the others) and
the PDF URLs fall through to the site 404 page.

## References

No other page linked to `/advisory/`; it was already noindex and kept out of
the sitemap and `llms.txt`. The claims ledger (private
`bast-ai/ai-workspace`, `website/content-claims.md`) has no advisory rows.
Earlier decision notes (2026-08-21, 2026-09-08) and Noviant proposals describe
the advisory pages as history; this note supersedes them.

## Guardrails

`scripts/check.mjs` fails if any archived advisory file is built, if a built page
other than the stub links to `/advisory/`, or if the stub loses its noindex tag
or redirect.
