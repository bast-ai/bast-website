# Bast Website

Source for the public Bast AI website.

This repo is intentionally small: static HTML, CSS, and JavaScript; a tiny
Node build script; an nginx runtime image; and Bitbucket Pipelines deployment
to DuploCloud.

## Structure

- `src/` - source HTML, CSS, JavaScript, and assets
- `scripts/` - local build and repository checks
- `nginx/` - production nginx template for the Duplo container
- `docs/content-claims.md` - evidence and owner notes for public claims
- `docs/decisions/` - lightweight decision records

## Local Development

```bash
pnpm install
pnpm verify
pnpm preview
```

Then open `http://localhost:8080`.

## Analytics

Analytics are opt-in. GA4 does not load unless a visitor chooses "Allow
analytics." Use a dedicated Bast GA4 web stream measurement ID, not the
Beth Rudden site ID.

For production builds, pass:

```bash
GA_MEASUREMENT_ID=G-XXXXXXXXXX pnpm build
```

If no measurement ID is provided, the consent banner and GA4 loader stay off.

## Deployment Shape

- Bitbucket is the source of truth.
- Bitbucket Pipelines builds the static site into an nginx image.
- The image is pushed to ECR.
- DuploCloud updates the website service image.
- `dev` deploys a noindex preview.
- `main` deploys the production site.

The Duplo service names and tenant names in `bitbucket-pipelines.yml` are
starter defaults and should be confirmed when the services are created.
