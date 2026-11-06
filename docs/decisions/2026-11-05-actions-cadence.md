# Actions cadence: metrics four times a day, dispatch after commit

Date: 2026-11-05
Status: Pending Grok Security review
Owner: Beth (approved the cadence, then restored the Deploy dispatch). Security reviews before merge.

## Decision

Beth approved Frugal's cadence recommendations at 8:53 AM MT on 5 November 2026,
then at 9:13 AM MT said to restore the Deploy dispatch after the metrics commit.
This repository takes the two items that live here. The BastCare review-queue
schedule is unchanged (the committer identity fix is already on main via #86).

- `.github/workflows/bastcare-metrics.yml` runs four times a day
  (`0 */6 * * *`) and on `workflow_dispatch`. When
  `src/assets/data/bastcare-metrics.json` changes, the job commits and pushes
  that file only, as `github-actions[bot]`
  (`41898282+github-actions[bot]@users.noreply.github.com`). On `changed=true`
  it dispatches Deploy (`gh workflow run deploy.yml --ref main`) and waits
  for that run.
- `.github/workflows/deploy.yml` runs on push to `main` and on
  `workflow_dispatch`. The daily cron stays removed. The App Store ratings and
  reviews step is best-effort: a failure logs a warning and the rest of the
  build still publishes Pages, using the last committed snapshot.

## Publish path

A push made with `GITHUB_TOKEN` does not start other workflows. The metrics
push and the explicit Deploy dispatch are one path for a metrics-only commit,
not a duplicate cascade. The dispatch is how that commit reaches www.bast.ai.
`deploy.yml` still publishes on a push to `main` from any other token, and on
a manual `workflow_dispatch`. Branch protection is not weakened. If a later
rule rejects the bot push, do not weaken it.

## What this does not change

- The review-queue workflow cadence.
- The public metrics URL and JSON shape.
- Pages hosting, DNS, and analytics.
- No API key is stored in the repo.
