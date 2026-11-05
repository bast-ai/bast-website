# Actions cadence: metrics four times a day, one publish path

Date: 2026-11-05
Status: Pending Grok Security review
Owner: Beth (approved the cadence). Security reviews before merge.

## Decision

Beth approved Frugal's cadence recommendations at 8:53 AM MT on 5 November 2026.
This repository takes the two items that live here. The BastCare review-queue
schedule is unchanged (the committer identity fix is already on main via #86).

- `.github/workflows/bastcare-metrics.yml` runs four times a day
  (`0 */6 * * *`) and on `workflow_dispatch`. When
  `src/assets/data/bastcare-metrics.json` changes, the job commits and pushes
  that file only, as `github-actions[bot]`
  (`41898282+github-actions[bot]@users.noreply.github.com`). It does not
  dispatch Deploy.
- `.github/workflows/deploy.yml` runs on push to `main` and on
  `workflow_dispatch`. The daily cron is removed. The App Store ratings and
  reviews step is best-effort: a failure logs a warning and the rest of the
  build still publishes Pages, using the last committed snapshot.

## Publish path

The metrics job keeps the commit and drops the `workflow_dispatch` of Deploy.
`deploy.yml` still publishes on push to `main`. A push made with `GITHUB_TOKEN`
does not start other workflows, and this job still uses that token, so the
metrics commit itself does not start Deploy. www.bast.ai updates on the next
Deploy started some other way: a push to `main` that is not made with
`GITHUB_TOKEN`, or a manual `workflow_dispatch`. Branch protection is not
weakened. If a later rule rejects the bot push, do not weaken it.

## What this does not change

- The review-queue workflow cadence.
- The public metrics URL and JSON shape.
- Pages hosting, DNS, and analytics.
- No API key is stored in the repo.
