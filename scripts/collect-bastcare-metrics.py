#!/usr/bin/env python3
"""Fetch and publish privacy-safe BastCare processing metrics.

The CareLoop API performs the aggregate against its existing request ledger.
This website-side job receives only six approved totals and never has MongoDB
credentials or access to individual documents.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit, urlunsplit
from urllib.request import Request, urlopen


API_URL_ENV = "BASTCARE_METRICS_API_URL"
CARELOOP_ENDPOINT_ENV = "CARELOOP_CLOUD_ENDPOINT"
API_KEY_ENVS = (
    "BASTCARE_METRICS_API_KEY",
    "CARELOOP_CLOUD_API_KEY",
    "CARELOOP_API_KEY",
)
METRICS_PATH = "/v1/internal/bastcare-metrics"
DEFAULT_OUTPUT = Path("src/assets/data/bastcare-metrics.json")
MAX_RESPONSE_BYTES = 64 * 1024
METRIC_NAMES = (
    "successfulSummaries",
    "inputTokens",
    "outputTokens",
    "totalTokens",
    "summariesWithTokenUsage",
    "summariesWithoutTokenUsage",
)


def _to_long(path: str) -> dict[str, Any]:
    """Return a null-safe numeric conversion expression for one field."""
    return {
        "$convert": {
            "input": path,
            "to": "long",
            "onError": None,
            "onNull": None,
        }
    }


def _coalesce(*expressions: Any) -> dict[str, Any]:
    """Return nested two-argument $ifNull expressions for Compass compatibility."""
    if len(expressions) < 2:
        raise ValueError("_coalesce requires at least two expressions")
    result: Any = expressions[-1]
    for expression in reversed(expressions[:-1]):
        result = {"$ifNull": [expression, result]}
    return result


def build_pipeline(since: datetime | None = None) -> list[dict[str, Any]]:
    """Build the aggregate-only pipeline.

    ``tokenUsage`` is the canonical, normalized receipt. ``usage`` is the raw
    provider metrics copied into the same log row. The expressions choose one
    value per field and never add the two objects together.
    """
    match: dict[str, Any] = {
        "status": 200,
        "processingStatus": "succeeded",
        "sourceType": "transcript",
        "aiGenerated": True,
    }
    if since is not None:
        # Current rows store an ISO-8601 UTC string. Date rows are accepted too.
        since_iso = since.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        match["$or"] = [
            {"processedAt": {"$gte": since_iso}},
            {"processedAt": {"$gte": since}},
        ]

    return [
        {"$match": match},
        {
            "$set": {
                "_inputTokens": _coalesce(
                    _to_long("$tokenUsage.inputTokens"),
                    _to_long("$usage.input_tokens"),
                    _to_long("$usage.prompt_tokens"),
                ),
                "_outputTokens": _coalesce(
                    _to_long("$tokenUsage.outputTokens"),
                    _to_long("$usage.output_tokens"),
                    _to_long("$usage.completion_tokens"),
                ),
                "_reportedTotalTokens": _coalesce(
                    _to_long("$tokenUsage.totalTokens"),
                    _to_long("$usage.total_tokens"),
                ),
            }
        },
        {
            "$set": {
                "_totalTokens": {
                    "$ifNull": [
                        "$_reportedTotalTokens",
                        {
                            "$cond": [
                                {
                                    "$and": [
                                        {"$ne": ["$_inputTokens", None]},
                                        {"$ne": ["$_outputTokens", None]},
                                    ]
                                },
                                {"$add": ["$_inputTokens", "$_outputTokens"]},
                                None,
                            ]
                        },
                    ]
                }
            }
        },
        {
            "$group": {
                "_id": None,
                "successfulSummaries": {"$sum": 1},
                "inputTokens": {"$sum": {"$ifNull": ["$_inputTokens", 0]}},
                "outputTokens": {"$sum": {"$ifNull": ["$_outputTokens", 0]}},
                "totalTokens": {"$sum": {"$ifNull": ["$_totalTokens", 0]}},
                "summariesWithTokenUsage": {
                    "$sum": {"$cond": [{"$ne": ["$_totalTokens", None]}, 1, 0]}
                },
            }
        },
        {
            "$project": {
                "_id": 0,
                "successfulSummaries": 1,
                "inputTokens": 1,
                "outputTokens": 1,
                "totalTokens": 1,
                "summariesWithTokenUsage": 1,
                "summariesWithoutTokenUsage": {
                    "$subtract": [
                        "$successfulSummaries",
                        "$summariesWithTokenUsage",
                    ]
                },
            }
        },
    ]


def _parse_api_timestamp(value: Any) -> str:
    if not isinstance(value, str) or not value.endswith("Z"):
        raise ValueError("API timestamp must be UTC")
    datetime.fromisoformat(value.replace("Z", "+00:00"))
    return value


def validated_public_document(payload: Any) -> dict[str, Any]:
    """Validate and rebuild the API response from an explicit allowlist."""
    if not isinstance(payload, dict) or payload.get("schemaVersion") != 1:
        raise ValueError("unsupported metrics response")
    values = payload.get("metrics")
    period = payload.get("period")
    if not isinstance(values, dict) or not isinstance(period, dict):
        raise ValueError("incomplete metrics response")

    metrics: dict[str, int] = {}
    for name in METRIC_NAMES:
        value = values.get(name)
        if isinstance(value, bool) or not isinstance(value, int) or value < 0:
            raise ValueError("invalid metric value")
        metrics[name] = value

    if (
        metrics["summariesWithTokenUsage"]
        + metrics["summariesWithoutTokenUsage"]
        != metrics["successfulSummaries"]
    ):
        raise ValueError("inconsistent metrics coverage")

    generated = _parse_api_timestamp(payload.get("generatedAt"))
    if (
        period.get("kind") != "all-time"
        or period.get("startsAt") is not None
        or _parse_api_timestamp(period.get("endsAt")) != generated
    ):
        raise ValueError("invalid metrics period")

    return {
        "schemaVersion": 1,
        "generatedAt": generated,
        "period": {
            "kind": "all-time",
            "startsAt": None,
            "endsAt": generated,
        },
        "metrics": metrics,
    }


def _metrics_url() -> str:
    configured = os.environ.get(API_URL_ENV, "").strip() or os.environ.get(
        CARELOOP_ENDPOINT_ENV, ""
    ).strip()
    if not configured:
        raise ValueError(
            f"{API_URL_ENV} or {CARELOOP_ENDPOINT_ENV} must be set"
        )
    parsed = urlsplit(configured)
    if not parsed.hostname or parsed.username or parsed.password:
        raise ValueError("invalid CareLoop API URL")
    is_loopback = parsed.hostname in {"localhost", "127.0.0.1", "::1"}
    if parsed.scheme != "https" and not (parsed.scheme == "http" and is_loopback):
        raise ValueError("CareLoop API URL must use HTTPS")
    return urlunsplit((parsed.scheme, parsed.netloc, METRICS_PATH, "", ""))


def _api_key() -> str:
    key = next(
        (
            os.environ.get(name, "").strip()
            for name in API_KEY_ENVS
            if os.environ.get(name, "").strip()
        ),
        "",
    )
    if not key:
        raise ValueError("CareLoop API key is not configured")
    return key


def fetch_api_document(url: str, api_key: str) -> dict[str, Any]:
    request = Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "bastcare-public-metrics/1",
            "X-API-Key": api_key,
        },
        method="GET",
    )
    with urlopen(request, timeout=20) as response:
        if response.status != 200:
            raise RuntimeError("CareLoop metrics API returned a non-success status")
        body = response.read(MAX_RESPONSE_BYTES + 1)
    if len(body) > MAX_RESPONSE_BYTES:
        raise ValueError("CareLoop metrics response is too large")
    return validated_public_document(json.loads(body))


def _write_atomic(path: Path, document: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(document, indent=2, sort_keys=True) + "\n"
    with tempfile.NamedTemporaryFile(
        "w", encoding="utf-8", dir=path.parent, delete=False
    ) as handle:
        handle.write(payload)
        temporary = Path(handle.name)
    temporary.chmod(0o644)
    os.replace(temporary, path)


def _parse_since(value: str | None) -> datetime | None:
    if not value:
        return None
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument(
        "--since",
        help="Optional lower bound for --print-pipeline manual Compass checks.",
    )
    parser.add_argument(
        "--print-pipeline",
        action="store_true",
        help="Print the credential-free MongoDB pipeline and exit.",
    )
    parser.add_argument(
        "--minimum-successful-summaries",
        type=int,
        default=1,
        help="Do not replace the public file when the aggregate is unexpectedly low.",
    )
    args = parser.parse_args(argv)

    try:
        since = _parse_since(args.since)
    except ValueError:
        print("ERROR: --since must be an ISO-8601 timestamp", file=sys.stderr)
        return 2

    pipeline = build_pipeline(since)
    if args.print_pipeline:
        print(json.dumps(pipeline, indent=2, default=str))
        return 0
    if since is not None:
        print("ERROR: --since is supported only with --print-pipeline", file=sys.stderr)
        return 2

    try:
        document = fetch_api_document(_metrics_url(), _api_key())
        if (
            document["metrics"]["successfulSummaries"]
            < args.minimum_successful_summaries
        ):
            raise ValueError("aggregate failed the minimum-count safeguard")
        _write_atomic(args.output, document)
    except Exception as exc:
        # Never print the API key, URL, response body, or exception text.
        print(
            f"ERROR: metrics refresh failed ({type(exc).__name__})",
            file=sys.stderr,
        )
        return 1

    print(f"Wrote aggregate metrics to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
