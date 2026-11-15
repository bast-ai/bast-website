# Field notes and an open evidence library

Date: 2026-11-15
Owner: Beth
Status: Proposed (final sign-off is this PR)

## Context

The site had no field-notes section. `/evidence/` showed five studies in the
page. The rest loaded from `GET https://forms.aws.bast.ai/library` after a
reader opened an emailed link. That link carries a token minted in
bast-infra by `createToken` (`lambda/forms/logic.ts`,
`TOKEN_LIFETIME_SECONDS` = 7 days) and checked in `library()`
(`lambda/forms/handler.ts`). `library.json` stays in a private S3 bucket.
The page did not store the token. Open PR 92 would have kept one in the
browser for 30 days. This change does not.

## Decision

- Publish two field notes dated November 13, 2026 under `/field-notes/`,
  linked from the footer Company column.
- `/evidence/` requests the library with no token. The optional "Send me
  Bast updates" form stays on the page and does not hide the studies. It
  posts to `POST /signup`.
- `library.json` is not added to this repo. `POST /contact` is unchanged.

Until bast-infra returns `library.json` from `GET /library` with no token,
the full study list does not render. The five findings on the page stay
public, as they were.
