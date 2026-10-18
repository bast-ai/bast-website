# Move internal working docs to ai-workspace

Date: 2026-10-18
Status: Approved by Beth

## Decision

Move internal material out of this public repo into the private
`bast-ai/ai-workspace` repo, under `website/`:

| Was here | Now in ai-workspace |
|---|---|
| `docs/content-claims.md` | `website/content-claims.md` |
| `docs/proposals/` (two Noviant GEO reviews, the Substack draft from the first drop) | `website/proposals/` |
| `docs/decisions/2026-08-28-adopt-noviant-geo-layer.md`, `docs/decisions/2026-09-05-noviant-drop-2-frame-and-schema.md` | `website/decisions/` |
| `docs/narrative/bast-moonshot.md` | `website/narrative/` |
| `docs/bastcare-public-metrics.md` | `website/bastcare-public-metrics.md` (local paths replaced with placeholders) |
| `BastCare w-Subscription/` (20 screenshots) | `website/bastcare-screenshots/` |

`scripts/run-bastcare-metrics.sh` stays, because it is the entry point for the
collector that writes `src/assets/data/bastcare-metrics.json` and PR CI checks
its syntax. ai-workspace holds no code. The script no longer names local paths:
it reads the env file from `BASTCARE_METRICS_ENV_FILE`. The checkout location
is `BASTCARE_METRICS_REPO_DIR`, which defaults to the script's own repository.

## Why

A public-repo audit found draft and unconfirmed claims, vendor process notes,
an unpublished narrative, pre-release subscription screens, and local machine
paths. None of them are needed to build or check the site.

Git history was not rewritten, so earlier versions stay visible in this repo's
history. `scripts/check.mjs` never read the claims ledger, so no replacement
public file is needed.

## Guardrails

Keep internal material out of this repo (see `CLAUDE.md`). Check the claims
ledger in ai-workspace before adding or changing a public claim.
