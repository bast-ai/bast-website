#!/usr/bin/env python3
"""Tests for the BastCare aggregate metrics collector."""

from __future__ import annotations

import importlib.util
import json
import os
import unittest
from datetime import datetime, timedelta
from pathlib import Path
from unittest.mock import patch


SCRIPT = Path(__file__).with_name("collect-bastcare-metrics.py")
SPEC = importlib.util.spec_from_file_location("collect_bastcare_metrics", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)

VERIFIED_RESPONSE = {
    "schemaVersion": 1,
    "generatedAt": "2026-08-22T02:46:31Z",
    "period": {
        "kind": "all-time",
        "startsAt": None,
        "endsAt": "2026-08-22T02:46:31Z",
    },
    "metrics": {
        "successfulSummaries": 29,
        "inputTokens": 89498,
        "outputTokens": 53631,
        "totalTokens": 143129,
        "summariesWithTokenUsage": 29,
        "summariesWithoutTokenUsage": 0,
    },
}


def _feedback_days(count: int) -> list[dict]:
    start = datetime(2026, 10, 7)
    return [
        {
            "date": (start + timedelta(days=offset)).date().isoformat(),
            "count": 0,
        }
        for offset in range(count)
    ]


class MetricsCollectorTests(unittest.TestCase):
    def test_pipeline_filters_only_successful_transcript_summaries(self):
        match = MODULE.build_pipeline()[0]["$match"]
        self.assertEqual(
            match,
            {
                "status": 200,
                "processingStatus": "succeeded",
                "sourceType": "transcript",
                "aiGenerated": True,
            },
        )

    def test_pipeline_prefers_normalized_receipt_before_raw_usage(self):
        fields = MODULE.build_pipeline()[1]["$set"]
        input_choices = fields["_inputTokens"]["$ifNull"]
        output_choices = fields["_outputTokens"]["$ifNull"]
        total_choices = fields["_reportedTotalTokens"]["$ifNull"]
        self.assertEqual(
            input_choices[0]["$convert"]["input"], "$tokenUsage.inputTokens"
        )
        self.assertEqual(
            input_choices[1]["$ifNull"][0]["$convert"]["input"],
            "$usage.input_tokens",
        )
        self.assertEqual(
            output_choices[0]["$convert"]["input"], "$tokenUsage.outputTokens"
        )
        self.assertEqual(
            output_choices[1]["$ifNull"][0]["$convert"]["input"],
            "$usage.output_tokens",
        )
        self.assertEqual(
            total_choices[0]["$convert"]["input"], "$tokenUsage.totalTokens"
        )
        self.assertEqual(
            total_choices[1]["$convert"]["input"], "$usage.total_tokens"
        )

    def test_api_document_is_validated_and_rebuilt_from_allowlist(self):
        payload = json.loads(json.dumps(VERIFIED_RESPONSE))
        payload["authSubject"] = "must-not-appear"
        payload["metrics"]["requestId"] = "must-not-appear"
        document = MODULE.validated_public_document(payload)
        self.assertEqual(
            set(document), {"schemaVersion", "generatedAt", "period", "metrics"}
        )
        self.assertNotIn("authSubject", repr(document))
        self.assertNotIn("requestId", repr(document))
        self.assertEqual(document["metrics"], VERIFIED_RESPONSE["metrics"])

    def test_api_document_rejects_inconsistent_coverage(self):
        payload = json.loads(json.dumps(VERIFIED_RESPONSE))
        payload["metrics"]["summariesWithoutTokenUsage"] = 1
        with self.assertRaisesRegex(ValueError, "inconsistent"):
            MODULE.validated_public_document(payload)

    def test_metrics_url_reuses_careloop_endpoint_origin(self):
        with patch.dict(
            os.environ,
            {
                MODULE.CARELOOP_ENDPOINT_ENV: (
                    "https://careloop.example.test/v1/visits/summarize-v2"
                )
            },
            clear=True,
        ):
            self.assertEqual(
                MODULE._metrics_url(),
                "https://careloop.example.test/v1/internal/bastcare-metrics",
            )

    def test_metrics_url_requires_https_except_for_local_smoke(self):
        with patch.dict(
            os.environ,
            {MODULE.API_URL_ENV: "http://careloop.example.test/metrics"},
            clear=True,
        ):
            with self.assertRaisesRegex(ValueError, "HTTPS"):
                MODULE._metrics_url()
        with patch.dict(
            os.environ,
            {MODULE.API_URL_ENV: "http://127.0.0.1:8085/metrics"},
            clear=True,
        ):
            self.assertEqual(
                MODULE._metrics_url(),
                "http://127.0.0.1:8085/v1/internal/bastcare-metrics",
            )

    def test_dedicated_metrics_key_precedes_general_careloop_key(self):
        with patch.dict(
            os.environ,
            {
                "BASTCARE_METRICS_API_KEY": "metrics-secret",
                "CARELOOP_API_KEY": "general-secret",
            },
            clear=True,
        ):
            self.assertEqual(MODULE._api_key(), "metrics-secret")

    def test_fetch_sends_api_key_and_returns_only_validated_totals(self):
        class FakeResponse:
            status = 200

            def __enter__(self):
                return self

            def __exit__(self, *_args):
                return False

            def read(self, _limit):
                return json.dumps(VERIFIED_RESPONSE).encode("utf-8")

        seen = {}

        def fake_urlopen(request, timeout):
            seen["key"] = request.get_header("X-api-key")
            seen["timeout"] = timeout
            return FakeResponse()

        with patch.object(MODULE, "urlopen", fake_urlopen):
            document = MODULE.fetch_api_document(
                "https://careloop.example.test/v1/internal/bastcare-metrics",
                "cron-secret",
            )
        self.assertEqual(seen, {"key": "cron-secret", "timeout": 20})
        self.assertEqual(document, VERIFIED_RESPONSE)

    def test_publishable_snapshot_accepts_an_equal_or_higher_count(self):
        self.assertEqual(
            MODULE.require_publishable_snapshot(VERIFIED_RESPONSE, 29)["metrics"][
                "successfulSummaries"
            ],
            29,
        )
        payload = json.loads(json.dumps(VERIFIED_RESPONSE))
        payload["metrics"]["successfulSummaries"] = 30
        payload["metrics"]["summariesWithTokenUsage"] = 30
        self.assertEqual(
            MODULE.require_publishable_snapshot(payload, 29)["metrics"][
                "successfulSummaries"
            ],
            30,
        )

    def test_publishable_snapshot_rejects_a_lower_summary_count(self):
        with self.assertRaisesRegex(ValueError, "lower than the committed value 30"):
            MODULE.require_publishable_snapshot(VERIFIED_RESPONSE, 30)

    def test_publishable_snapshot_rejects_bad_shape_and_values(self):
        extra = json.loads(json.dumps(VERIFIED_RESPONSE))
        extra["authSubject"] = "must-not-appear"
        with self.assertRaisesRegex(ValueError, "schemaVersion, generatedAt, period"):
            MODULE.require_publishable_snapshot(extra, 1)

        wrong_version = json.loads(json.dumps(VERIFIED_RESPONSE))
        wrong_version["schemaVersion"] = 2
        with self.assertRaisesRegex(ValueError, "schemaVersion must be 1"):
            MODULE.require_publishable_snapshot(wrong_version, 1)

        boolean_version = json.loads(json.dumps(VERIFIED_RESPONSE))
        boolean_version["schemaVersion"] = True
        with self.assertRaisesRegex(ValueError, "schemaVersion must be 1"):
            MODULE.require_publishable_snapshot(boolean_version, 1)

        negative = json.loads(json.dumps(VERIFIED_RESPONSE))
        negative["metrics"]["inputTokens"] = -1
        with self.assertRaisesRegex(ValueError, "inputTokens must be an integer >= 0"):
            MODULE.require_publishable_snapshot(negative, 1)

        boolean = json.loads(json.dumps(VERIFIED_RESPONSE))
        boolean["metrics"]["outputTokens"] = True
        with self.assertRaisesRegex(ValueError, "outputTokens must be an integer >= 0"):
            MODULE.require_publishable_snapshot(boolean, 1)

    def test_committed_public_file_is_publishable(self):
        path = Path(__file__).resolve().parents[1] / "src/assets/data/bastcare-metrics.json"
        document = json.loads(path.read_text(encoding="utf-8"))
        validated = MODULE.require_publishable_snapshot(
            document, document["metrics"]["successfulSummaries"]
        )
        self.assertEqual(
            path.read_text(encoding="utf-8"),
            json.dumps(validated, indent=2, sort_keys=True) + "\n",
        )

    def test_feedback_counts_pass_through_unchanged(self):
        feedback = {
            "total": 4,
            "days": [
                {"date": "2026-11-05", "count": 2},
                {"date": "2026-10-07", "count": 1},
                {"date": "2024-02-29", "count": 1},
            ],
        }
        full_window = {
            "total": 0,
            "days": _feedback_days(MODULE.FEEDBACK_DAYS_MAX),
        }
        for series in (feedback, full_window, {"total": 0, "days": []}):
            payload = json.loads(json.dumps(VERIFIED_RESPONSE))
            payload["feedbackCounts"] = json.loads(json.dumps(series))
            payload["feedbackCounts"]["note"] = "must-not-appear"
            if series["days"]:
                payload["feedbackCounts"]["days"][0]["message"] = "must-not-appear"
            payload["authSubject"] = "must-not-appear"
            document = MODULE.validated_public_document(payload)
            self.assertEqual(document["feedbackCounts"], series)
            self.assertEqual(document["metrics"], VERIFIED_RESPONSE["metrics"])
            self.assertNotIn("must-not-appear", repr(document))
            published = MODULE.require_publishable_snapshot(document, 29)
            self.assertEqual(published["feedbackCounts"], series)
            self.assertEqual(published["metrics"], VERIFIED_RESPONSE["metrics"])

    def test_feedback_counts_omitted_when_missing(self):
        payload = json.loads(json.dumps(VERIFIED_RESPONSE))
        document = MODULE.validated_public_document(payload)
        self.assertNotIn("feedbackCounts", document)
        self.assertEqual(document["metrics"], VERIFIED_RESPONSE["metrics"])

        payload["feedbackCounts"] = None
        document = MODULE.validated_public_document(payload)
        self.assertNotIn("feedbackCounts", document)
        self.assertEqual(document["metrics"], VERIFIED_RESPONSE["metrics"])

        published = MODULE.require_publishable_snapshot(
            json.loads(json.dumps(VERIFIED_RESPONSE)), 29
        )
        self.assertNotIn("feedbackCounts", published)
        self.assertEqual(published["metrics"], VERIFIED_RESPONSE["metrics"])

    def test_feedback_counts_omitted_when_invalid(self):
        invalid = [
            {"total": -1, "days": []},
            {"total": True, "days": []},
            {"total": 1.2, "days": []},
            {"total": "1", "days": []},
            {"days": []},
            {"total": 0},
            {"total": 1, "days": [1, 0, 1]},
            {"total": 1, "days": [{"date": "2026-11-05", "count": -1}]},
            {"total": 1, "days": [{"date": "2026-11-05", "count": True}]},
            {"total": 1, "days": [{"date": "2026-02-31", "count": 0}]},
            {"total": 1, "days": [{"date": "2026-11-5", "count": 0}]},
            {"total": 1, "days": [{"date": "11/05/2026", "count": 0}]},
            {"total": 0, "days": [{"date": "2026-11-05"}]},
            {
                "total": 1,
                "days": [
                    {"date": "2026-11-05", "count": 1},
                    {"date": "nope", "count": 0},
                ],
            },
            {"total": 0, "days": _feedback_days(MODULE.FEEDBACK_DAYS_MAX + 1)},
            [],
            4,
            "none",
            {},
        ]
        for value in invalid:
            payload = json.loads(json.dumps(VERIFIED_RESPONSE))
            payload["feedbackCounts"] = value
            document = MODULE.validated_public_document(payload)
            self.assertNotIn("feedbackCounts", document, value)
            self.assertEqual(document["metrics"], VERIFIED_RESPONSE["metrics"])
            published = MODULE.require_publishable_snapshot(payload, 29)
            self.assertNotIn("feedbackCounts", published, value)
            self.assertEqual(published["metrics"], VERIFIED_RESPONSE["metrics"])

    def test_written_snapshot_matches_canonical_json(self):
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "bastcare-metrics.json"
            MODULE._write_atomic(path, dict(VERIFIED_RESPONSE))
            written = path.read_text(encoding="utf-8")
        self.assertEqual(
            written, json.dumps(VERIFIED_RESPONSE, indent=2, sort_keys=True) + "\n"
        )


if __name__ == "__main__":
    unittest.main()
