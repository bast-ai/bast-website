# Refresh BastCare public metrics from GitHub Actions

Date: 2026-11-02
Status: Proposed (final sign-off is this PR)
Owner: Beth (repository secret). Thanh reviews the production CareLoop call.

## Context

`src/assets/data/bastcare-metrics.json` is served unchanged at
`https://www.bast.ai/assets/data/bastcare-metrics.json`. A Slack routine and
the daily briefing read that URL. The file is schemaVersion 1: `generatedAt`,
six aggregate metrics, and an all-time `period`. It last refreshed at
2026-10-30T20:17:01Z from a cron on a laptop against the old Duplo setup.

The production CareLoop service is `https://careloop.aws.bast.ai`.
`GET /v1/internal/bastcare-metrics` is live and returns 401 without
`X-API-Key`. Staging is `https://dev-careloop.aws.bast.ai`. The public file
shows production totals.

## Decision

- `.github/workflows/bastcare-metrics.yml` runs at minute 17 of every hour
  and on `workflow_dispatch`. It runs the metrics unit tests, then
  `scripts/collect-bastcare-metrics.py` with
  `BASTCARE_METRICS_API_URL=https://careloop.aws.bast.ai/v1/internal/bastcare-metrics`
  and the repository secret `BASTCARE_METRICS_API_KEY`. The workflow does not
  print the key. A missing secret fails the job with a readable error.
- The job commits `src/assets/data/bastcare-metrics.json` only, as
  `github-actions[bot]`, with the message `chore: refresh BastCare public metrics`,
  and only when validation passes: schemaVersion 1, the six totals are
  integers greater than or equal to 0, and `successfulSummaries` is not lower
  than the committed value. The collector still refuses a count below 1.
- Checked on 2026-11-02: `main` is not branch-protected and this repository
  has no rulesets, so the bot push does not require a protection change. Do
  not weaken branch protection if that changes. The replacement is to run the
  collector during `.github/workflows/deploy.yml` and write the file into
  `dist/` only, leaving the committed file in place when the API fails.
- A push made with `GITHUB_TOKEN` does not start other workflows. After a
  commit, this workflow dispatches the existing Deploy to GitHub Pages
  workflow (`workflow_dispatch` on `main`) and waits for it. `deploy.yml` is
  unchanged.
- Turn off the old laptop/Duplo cron. `scripts/run-bastcare-metrics.sh`
  remains for a manual run. The env file stays outside this repository.

## Update (2026-11-05)

Cadence is now four times a day. After a metrics commit, this workflow still
dispatches Deploy, because a `GITHUB_TOKEN` push does not start it. The daily
Deploy cron is removed. The bot identity and the rule against weakening
branch protection are unchanged. See
[2026-11-05-actions-cadence.md](./2026-11-05-actions-cadence.md).

## What this does not change

- The public URL and the JSON shape.
- Pages hosting, DNS, or analytics.
- No API key is stored in the repo.
