# Decision: host the static site on GitHub Pages, not DuploCloud

Date: 2026-07-06
Status: Accepted (supersedes the Duplo path in the 2026-06-28 static-Duplo-site note)
Owner: Beth (has GoDaddy + repo admin)

## Context

The site is fully static HTML/CSS/JS with a tiny Node build step and no backend
or application services. The original plan (Bitbucket Pipelines → ECR → nginx
container on DuploCloud) was built for services that need a runtime. After a
call with Thanh, we agreed that machinery is unnecessary overhead for a static
site.

## Decision

Publish the built `dist/` to **GitHub Pages** via a GitHub Actions workflow.
GoDaddy DNS points `www.bast.ai` at Pages. No containers, no Duplo, no ECR.

- Repo owner assumed to be `bast-ai` on GitHub → Pages host `bast-ai.github.io`.
  Confirm before DNS.
- `.github/workflows/deploy.yml` runs `pnpm verify` (build + checks) with
  production env and deploys on push to `main` (or manual `workflow_dispatch`).
- `src/CNAME` pins the custom domain so it survives every deploy.
- `GA_MEASUREMENT_ID` is a GitHub repository **variable**; the same
  `scripts/check.mjs` guard still fails the build if the Beth Rudden id appears.

## What we retired

- `Dockerfile`, `nginx/default.conf.template`, `bitbucket-pipelines.yml`.
- DuploCloud services (`dev-`/`prod-bast-website`), tenants, ECR repo, and the
  `DUPLO_*`/`ECR_REGISTRY` secrets. None need to be provisioned.
- The `/health` endpoint (no orchestrator to health-check).

## Tradeoffs accepted

- **No custom HTTP headers.** GitHub Pages cannot emit the security headers
  nginx set (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`, `X-Robots-Tag`). Indexing is still controlled by the
  `<meta name="robots">` tag in the build. If edge headers become a
  requirement, front Pages with Cloudflare (proxied DNS + Transform Rules) or
  move to Cloudflare Pages, which supports a `_headers` file.
- **apex → www redirect** is now handled by GitHub Pages/DNS instead of nginx.
- **No separate always-on dev environment.** Pre-cutover validation happens on
  the `*.github.io` URL or via a low-TTL staged DNS change; PR previews can be
  added later with a separate workflow if wanted.

## Analytics is unchanged

GA4 still loads only after the visitor allows analytics (consent defaults to
denied). Reuse the existing Bast GA4 property so history stays continuous.
