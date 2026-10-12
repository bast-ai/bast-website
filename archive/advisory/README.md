# Archived: Bast Advisory pages

Archived 2026-10-12 at Beth's direction. See
`docs/decisions/2026-10-12-archive-advisory-pages.md`.

Nothing in `archive/` is built or published: `scripts/build.mjs` copies only
`src/`. These files are kept in git for reference only.

- `*.html`: the former `/advisory/` pages (landing, healthcare, EU AI Act, change).
- `assets/`: `advisory.css` and the three advisory one-pager PDFs.
- `scripts/`: `advisory-pdf.mjs` and `verify-text.mjs`, which rendered the PDFs
  from the live pages. They will not run as-is; paths assume the pages are in `src/`.
- `docs/`: the page copy text files from `docs/advisory-pages/`.

`/advisory/` on the live site is now a noindex stub that sends visitors home.
