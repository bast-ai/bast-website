# Deployment Notes

## Shape

- Source of truth: GitHub repo `bast-ai/bast-website` (confirm owner).
- Host: **GitHub Pages**, served from the built `dist/`.
- Build + publish: `.github/workflows/deploy.yml` (GitHub Actions) on push to
  `main` or manual `workflow_dispatch`. It runs `pnpm verify` with production
  env, then uploads `dist/` and deploys to Pages.
- Custom domain: `www.bast.ai`, pinned by `src/CNAME`.
- No containers, nginx, ECR, or DuploCloud. See the decision note:
  [decisions/2026-07-06-github-pages-hosting.md](./decisions/2026-07-06-github-pages-hosting.md).

## GoDaddy DNS

Do not change GoDaddy DNS until the GitHub Pages custom domain is configured.

- `www.bast.ai` → CNAME → `bast-ai.github.io`
- `bast.ai` (apex) → A records `185.199.108.153`, `185.199.109.153`,
  `185.199.110.153`, `185.199.111.153`
- GitHub Pages redirects `bast.ai → www.bast.ai` automatically once both resolve.
- Turn on **Enforce HTTPS** after the cert provisions.

Full sequence: [deployment-runbook.md](./deployment-runbook.md).

## GA4

Reuse the existing Bast GA4 property. Set the GitHub Actions repository
variable:

```
GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Do not reuse the Beth Rudden site measurement id (`G-FL8JCB0PXZ`);
`scripts/check.mjs` fails the build if it appears.

## BastCare public metrics

`src/assets/data/bastcare-metrics.json` is served at
`https://www.bast.ai/assets/data/bastcare-metrics.json`.
`.github/workflows/bastcare-metrics.yml` refreshes it four times a day
(`0 */6 * * *`) from production CareLoop and commits the file when the totals
change. The API key is the repository secret `BASTCARE_METRICS_API_KEY`. It is
not stored in this repo. The job does not dispatch Deploy.

A push made with `GITHUB_TOKEN` does not start other workflows, and this job
still uses that token. `deploy.yml` publishes Pages on a push to `main` from
any other token, and on manual `workflow_dispatch`. There is no scheduled
Deploy. The metrics file reaches www.bast.ai on the next one of those runs.

Turn off the old laptop/Duplo cron that ran `scripts/run-bastcare-metrics.sh`.
That script remains for a manual run. See
[decisions/2026-11-05-actions-cadence.md](./decisions/2026-11-05-actions-cadence.md).
