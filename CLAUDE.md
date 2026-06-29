# CLAUDE.md

Read the current file state before touching anything.

This is the public Bast website repo. It should stay boring, portable, and
easy to reason about.

## Operating Lens

Use the Bast principles from the platform repos, especially:

- Minimum viable change.
- Reuse existing assets and patterns before inventing new ones.
- Keep public claims traceable to evidence.
- Human sign-off for material positioning, privacy, analytics, and DNS changes.

## Scope

This repo is a static public website. Do not introduce OpenSpec for ordinary
content or layout changes. Use lightweight decision notes in `docs/decisions/`
when the choice affects hosting, privacy, analytics, positioning, or public
claims.

## Commands

```bash
pnpm install
pnpm verify
pnpm preview
```

## Analytics

Consent is basic and conservative: GA4 is not loaded until the visitor chooses
"Allow analytics." Use a Bast-specific GA4 measurement ID.

Do not commit secrets, credentials, GoDaddy access details, Duplo tokens, or
analytics admin credentials.

## Deployment

The intended deploy path is Bitbucket Pipelines -> ECR -> DuploCloud service.
The nginx container serves the static `dist/` output on port 8080.
