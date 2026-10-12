# BastCare App Store version and review approval queue

Date: 2026-10-12
Owner: Beth
Status: Proposed (approved in principle by Beth 2026-10-12; final sign-off is this PR)

## Context

The BastCare page and the Bast home page hardcoded "BastCare 1.0.10" while the
App Store was on 1.0.12. Rating and count already refreshed from Apple on every
deploy (`docs/decisions/2026-09-01-bastcare-public-review-refresh.md`), but
every new U.S. written review was also published automatically, without
review.

## Decision

1. **Facts come from Apple automatically.** Version, average rating, rating
   count, and written-review count come from Apple's public lookup and review
   feeds during each deploy (push to main and daily). `scripts/build.mjs`
   writes them into the HTML (`__BASTCARE_VERSION__` and the rating tokens),
   so no-JS readers and crawlers see current values, and `site.js` fills
   `data-bastcare-version` and the rating spots from the same snapshot.
2. **Words are approved by a person.** Review text renders only when its id is
   in `data/bastcare-reviews/approved.json`. The daily
   `.github/workflows/bastcare-review-queue.yml` adds new reviews to
   `pending.json` and keeps one pull request open on
   `automation/bastcare-review-queue`. Beth approves by moving an entry to
   `approved.json` and merging, or declines by moving it to `rejected.json`.
   `data/` is not copied into the site, so pending text is never published.
3. **Release notes are approved copy too.** The "What's new" block on
   `/bastcare/` is written by hand and carries
   `data-bastcare-release-notes-version`. The queue PR flags when the App Store
   version is newer than that marker; nothing rewrites the notes.
4. **Media names do not carry a version.** Release and walkthrough media moved
   to version-free file names (`bastcare-release.*`, `bastcare-walkthrough-*`).
   Screenshot alt text describes the screen, not a release.

## Featured Australian review

"This app is a Godsend" comes from Apple's Australian feed (review id
14459797025, version 1.0.1), which the U.S. refresh does not read. It stays as
hand-placed HTML with an editorially trimmed quote and is recorded in
`approved.json` with `storefront: "au"` and `placement: "featured"` for
provenance. It is excluded from the carousel. `scripts/check.mjs` fails if that
record is missing.

## Permissions

- Deploy (`deploy.yml`) stays `contents: read`; it never commits.
- Only the queue workflow has `contents: write` and `pull-requests: write`.
  The repository setting "Allow GitHub Actions to create and approve pull
  requests" must be on for it to open the PR.
- Pull requests opened with the workflow token do not trigger `pr-ci.yml`; the
  queue only edits a JSON file that `pnpm verify` checks on the next deploy.

## Guardrails

- `scripts/check.mjs` fails if the public snapshot holds an unapproved id, if
  pending or rejected text appears in built pages, if an id is both approved and
  pending/rejected, or if "1.0.10" or a versioned screenshot alt returns.
- The collector rejects non-numeric versions before they can reach HTML.
