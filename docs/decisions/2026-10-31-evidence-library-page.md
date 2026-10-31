# Public evidence library page

Date: 2026-10-31
Owner: Beth
Status: Proposed (final sign-off is this PR)

## Context

The site is static on GitHub Pages. A sign-up service is live at
`https://forms.aws.bast.ai`. It emails a confirmation link through Brevo.
The link returns the reader to `/evidence/?t=<token>`. The full library
stays off this public repo and is returned only to a confirmed token.

An earlier draft (closed PR 62) used a public `library.json` and a
client-side gate. That file is not part of this page.

## Decision

- The page lives at `/evidence/`. The intro and five preview findings are
  public. The full library loads only after the confirmation token.
- On load the page reads `t`, removes it from the address bar, sends
  `no-referrer`, and does not store the token in the browser.
- The form posts `{email, name?, website, updates}` to `POST /signup`.
  `website` is a hidden honeypot. `updates` is an optional boolean from an
  unticked checkbox labeled "Send me Bast updates".
- The page is linked from the BastCare footer column on `/bastcare/*` and
  from the BastCare page itself. It is not in the primary nav.
- The page is in `sitemap.xml` and `llms.txt`, with the usual share tags.
  It is not hard-coded `noindex`.
- `/privacy.html` names Brevo (Sendinblue SAS, EU) for these sign-ups.
- `scripts/check.mjs` rejects a published `library.json`, study ids beyond
  the five previews, any fetch origin other than `https://forms.aws.bast.ai`,
  the Brevo API host, and key-shaped strings.

The private claims ledger in `bast-ai/ai-workspace` still needs the
evidence-library claims recorded before launch. That ledger is not in this
repo.
