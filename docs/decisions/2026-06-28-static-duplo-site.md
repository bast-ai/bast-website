# Decision: Static Duplo Website

Date: 2026-06-28

## Decision

Build the Bast public website as a static site deployed through the team's
existing Bitbucket -> ECR -> DuploCloud path.

## Why

- Reuses the team's existing source control and deployment conventions.
- Avoids Webflow, HubSpot, and a separate GitHub Pages island.
- Keeps the site inspectable: files in git, simple build, static runtime.
- Makes use of DuploCloud, which Bast already pays for and operates.

## Consequences

- The site has one small container instead of pure object hosting.
- DNS cutover needs Duplo/ALB coordination.
- Marketing content changes still move through PRs, which is good for claims
  and privacy review.

## Open Items

- Confirm Bitbucket repo slug.
- Confirm Duplo service names and tenants.
- Create a dedicated Bast GA4 web stream measurement ID.
- Confirm production DNS target before GoDaddy changes.
