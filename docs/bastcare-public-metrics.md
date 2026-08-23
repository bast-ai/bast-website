# BastCare public metrics

The CareLoop API performs one aggregate-only read of
`careloop_summarizer.summarize_logs`. The website cron calls the authenticated
`GET /v1/internal/bastcare-metrics` endpoint and writes its six approved totals
to a small static JSON file. The cron never receives a MongoDB URI and neither
side retrieves or emits transcripts, summaries, identities, request IDs, or
individual processing records.

## Metric definitions

- `successfulSummaries`: documents with HTTP `status: 200`,
  `processingStatus: "succeeded"`, `sourceType: "transcript"`, and
  `aiGenerated: true`. This is a count of completed AI summary runs, not a count
  of unique patients or visits.
- `inputTokens`, `outputTokens`, `totalTokens`: sums from the normalized
  `tokenUsage` receipt. The raw `usage` object is used only when the matching
  normalized field is absent. The objects are never added together.
- `summariesWithTokenUsage` / `summariesWithoutTokenUsage`: coverage controls
  for interpreting token totals.

## Setup

The deployed CareLoop API reuses its normal `CARELOOP_MONGODB_URI` resolution
(environment, AWS Secrets Manager, or encrypted service configuration). Do not
copy that URI into the website environment.

The wrapper sources `/Users/bethrudden/bast-careloop/.env`. It derives the
metrics route from `CARELOOP_CLOUD_ENDPOINT` and authenticates with
`CARELOOP_API_KEY`. Optional `BASTCARE_METRICS_API_URL` and
`BASTCARE_METRICS_API_KEY` variables can override those values for a dedicated
cron configuration. The API key must match `CARELOOP_API_KEY` on the deployed
CareLoop service. Never commit or paste a key into website files, logs, or cron.

The collector refuses to replace the last known-good public file when the
successful count falls below one. It uses only Python's standard library; no
MongoDB client or extra package is required. Run the unit tests with:

```sh
python3 -m unittest scripts/test_collect_bastcare_metrics.py
```

Run the collection once with:

```sh
scripts/run-bastcare-metrics.sh
```

Example hourly cron entry (the wrapper prevents overlapping runs):

```cron
17 * * * * /Users/bethrudden/bast-website/scripts/run-bastcare-metrics.sh >>/tmp/bastcare-metrics.log 2>&1
```

Cron only updates a local checkout. Publishing the result still requires the
normal reviewed build/deployment workflow. For automated public publishing,
use a scheduled CI job with the API key stored as a protected secret, artifact
validation, and a reviewed deploy step.

For a manual Compass audit, print the same credential-free pipeline with:

```sh
python3 scripts/collect-bastcare-metrics.py --print-pipeline
```
