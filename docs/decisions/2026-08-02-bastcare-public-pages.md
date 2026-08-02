# BastCare public pages use stable, separate routes

**Date:** 2026-08-02
**Status:** Accepted and approved for publication
**Owner:** Beth

## Decision

Create six stable GitHub Pages routes for BastCare:

- `/bastcare/`
- `/bastcare/privacy/`
- `/bastcare/support/`
- `/bastcare/terms/`
- `/bastcare/delete-account/`
- `/bastcare/architecture/`

Use the existing static site shell and the canonical Bast design system from
`bast-platform/bast-admin-ui/packages/shared-styles`: self-hosted Estedad,
blue-grey light surfaces, accessible semantic text colors, the blue-to-indigo
brand gradient, 4px spacing rhythm, 16–24px radii, visible focus, and restrained
neumorphic elevation. Do not add a framework or copy React components into the
static site.

## Why separate pages

Stable, purpose-specific URLs are easier to use in App Store Connect, in-app
links, accessibility navigation, support responses, review evidence, and future
policy versioning than one long mixed-purpose page.

## Claim boundary

The marketing, privacy, support, and terms pages are production-facing. The
delete-account page states that coordinated deletion is not yet available until
the authenticated server endpoint and iPhone success/failure flow are proven.
The existing corporate website privacy page remains unchanged.

## Intentional launch gate

Beth approved the intentional BastCare publication on August 2, 2026. The
launch package includes:

- the dedicated Bast Google Analytics measurement ID and verified consent-first
  behavior (no GA4 request before “Allow analytics”);
- agreed BastCare page/event names and a small, content-free measurement plan;
- approved product, privacy, and support copy, with known pre-submission work
  stated transparently;
- final App Store URLs and a production link check;
- a rollback owner and a launch-day observation plan;
- launch communications and the celebration plan.

Analytics must never contain visit audio, transcript text, summary text, notes,
diagnoses, medications, invitation secrets, account deletion details, or other
health content.

## Source evidence

- `bast-careloop/docs/release/bastcare-public-site-content-review.md`
- `bast-careloop/docs/architecture/apple-store-bound-v2-solution-architecture.md`
- `bast-careloop/docs/decisions/2026-08-01-apple-store-bound-v2.md`
- `bast-careloop/openspec/changes/full-account-deletion-evidence/`

## Consequences

- App Store metadata can point to direct BastCare URLs after approval.
- The architecture remains readable without JavaScript or a diagram library.
- Content checks prevent removal of the privacy posture, honest deletion status,
  staging decision, cross-page navigation, and sitemap entries.
- Future policy or product changes require another reviewed deployment.
