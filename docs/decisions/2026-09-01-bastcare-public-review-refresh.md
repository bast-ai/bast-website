# BastCare public App Store review refresh

Date: 2026-09-01

## Decision

The public BastCare page shows the latest verified U.S. App Store rating count
and a carousel of public written-review excerpts. GitHub Actions refreshes a
strictly allowlisted JSON snapshot from Apple's public lookup and customer
review feeds during every deployment and once daily.

The browser reads only the same-origin snapshot served by www.bast.ai. It does
not call Apple directly. This keeps the site static, avoids disclosing a
visitor's IP address or browser details to Apple merely for viewing the page,
and preserves the last successfully deployed snapshot if Apple is unavailable.

## Public evidence boundary

- Rating average and count come from Apple's lookup response for App Store ID
  6789669565 and bundle ID ai.bast.careloop.
- Review title, public reviewer handle, rating, app version, date, and an
  excerpt of at most 24 words come from Apple's public customer-review feed.
- The collector rejects mismatched app identity, malformed counts, invalid
  ratings, oversized responses, duplicate reviews, and an unexpectedly empty
  review feed.
- No App Store Connect credentials or private customer information are used.

## Failure behavior

If refresh validation fails, deployment stops before replacing the current
public artifact. The already-deployed last verified snapshot remains live.
