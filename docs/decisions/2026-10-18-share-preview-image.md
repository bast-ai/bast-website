# Share preview image and Open Graph tags

Date: 2026-10-18
Owner: Beth
Status: Proposed (final sign-off is this PR)

## Context

The home page had `og:title`, `og:description`, `og:type`, and `og:url`, but no
`og:image` and no Twitter tags. iMessage and other link previewers fell back to
the largest image on the page, a Usage Analytics dashboard screenshot whose
small gray text can't be read at preview size. Most other pages had no share
tags at all.

## Decision

- A flat 1200×630 share card, `src/assets/og/bast-share.png` (about 21 KB): the
  real Bast logo (`src/assets/bast-logo.svg`), the site's Estedad font and
  palette (`--ink` #0d2935, `--accent-text` #075985, brand gradient
  #0090cc→#3c54a1), the headline "Explainable Healthcare AI That Shows Its
  Work", the existing home description line, and "bast.ai". No AI-generated
  imagery. Source and renderer: `scripts/og-image/` (manual; output is
  byte-reproducible).
- `scripts/build.mjs` fills in static share tags on every public page (those
  whose robots tag follows the build setting): `og:title`, `og:description`,
  `og:type`, `og:url`, `og:site_name`, `og:image` (+ type, width, height, alt),
  `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`,
  `twitter:image`. Values come from the page's own `<title>`, meta description,
  and canonical URL. Page-specific tags in the source win; the manifesto keeps
  its own image.
- noindex pages (404, CareTeam invitation, the archived `/advisory/` stub) and
  redirect stubs get no tags.

## Guardrail

`scripts/check.mjs` checks every sitemap URL for the full tag set, absolute
`og:image`/`twitter:image`/`og:url`, exactly one `og:image`, and
`summary_large_image`. It also checks that the default card is 1200×630 and
under 300 KB.
