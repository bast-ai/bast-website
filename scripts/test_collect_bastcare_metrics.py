#!/usr/bin/env python3
"""Tests for the BastCare aggregate metrics collector."""

from __future__ import annotations

import importlib.util
import json
import os
import unittest
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


if __name__ == "__main__":
    unittest.main()
