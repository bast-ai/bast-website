# Open evidence library

Date: 2026-11-15
Owner: Beth
Status: Proposed (final sign-off is this PR)

## Context

`/evidence/` showed five studies in the page. The rest loaded from
`GET https://forms.aws.bast.ai/library` after a reader opened an emailed
link. That link carries a token minted in bast-infra by `createToken`
(`lambda/forms/logic.ts`, `TOKEN_LIFETIME_SECONDS` = 7 days) and checked
in `library()` (`lambda/forms/handler.ts`). The page did not store the
token. Open PR 92 would have kept one in the browser for 30 days. This
change does not.

## Decision

- `/evidence/` loads the published library from `/assets/data/library.json`
  on this site, with no token. The optional "Send me Bast updates" form
  stays on the page and does not hide the studies. It posts to `POST /signup`.
- That file is the published library from ai-workspace commit
  `93d0e7bf3c98af1cf001efb57278e30286d13377`: 60 studies, last updated
  2026-11-10. `POST /contact` is unchanged.

The page reads the studies from this site. It does not call
`GET /library` on the forms service.
