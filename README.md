# Bast Website

Source for the public Bast AI website.

This repo is intentionally small: static HTML, CSS, and JavaScript; a tiny
Node build script; and a GitHub Actions workflow that publishes to GitHub Pages.

## Structure

- `src/` - source HTML, CSS, JavaScript, and assets (`src/CNAME` pins the domain)
- `scripts/` - local build and repository checks
- `.github/workflows/` - GitHub Actions build + Pages deploy
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

The build defaults to Bast's current GA4 stream:

```text
G-0D3N068YJH
```

To change it without editing code, set the GitHub Actions repository variable
`GA_MEASUREMENT_ID`. For a local test or one-off override, pass:

```bash
GA_MEASUREMENT_ID=G-0D3N068YJH pnpm build
```

## Deployment Shape

- GitHub is the source of truth.
- `.github/workflows/deploy.yml` builds the static site with `pnpm verify`.
- On push to `main` (or manual run) it publishes `dist/` to GitHub Pages.
- `www.bast.ai` points at Pages via GoDaddy DNS; `src/CNAME` pins the domain.

Set the `GA_MEASUREMENT_ID` repository variable before the production deploy.
See `docs/deployment-runbook.md` for the full cutover sequence.
