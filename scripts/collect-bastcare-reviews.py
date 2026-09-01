#!/usr/bin/env python3
"""Fetch a privacy-safe public BastCare App Store review snapshot.

The deploy job calls Apple's public lookup and customer-review feeds. Visitors
load only the resulting same-origin JSON file, so viewing the Bast website does
not disclose their IP address or browser details to Apple.
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
from urllib.request import Request, urlopen


APP_ID = 6789669565
BUNDLE_ID = "ai.bast.careloop"
STOREFRONT = "us"
APP_STORE_URL = "https://apps.apple.com/us/app/bastcare/id6789669565"
LOOKUP_URL = f"https://itunes.apple.com/lookup?id={APP_ID}&country={STOREFRONT}"
REVIEWS_URL = (
    f"https://itunes.apple.com/{STOREFRONT}/rss/customerreviews/"
    f"id={APP_ID}/sortBy=mostRecent/json"
)
DEFAULT_OUTPUT = Path("src/assets/data/bastcare-reviews.json")
MAX_RESPONSE_BYTES = 512 * 1024
MAX_REVIEWS = 50
MAX_EXCERPT_WORDS = 24


def _label(value: Any) -> str:
    if not isinstance(value, dict) or not isinstance(value.get("label"), str):
        raise ValueError("missing feed label")
    return value["label"].strip()


def _required_text(value: Any, *, maximum: int) -> str:
    if not isinstance(value, str):
        raise ValueError("review text must be a string")
    normalized = " ".join(value.split())
    if not normalized or len(normalized) > maximum:
        raise ValueError("review text is empty or too long")
    return normalized


def _excerpt(value: str) -> str:
    words = value.split()
    if len(words) <= MAX_EXCERPT_WORDS:
        return value
    return " ".join(words[:MAX_EXCERPT_WORDS]).rstrip(" ,.;:") + "…"


def _utc_timestamp(value: str) -> str:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError("timestamp must include a timezone")
    return parsed.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _rating(value: Any) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError("invalid average rating")
    rating = float(value)
    if not 0 <= rating <= 5:
        raise ValueError("average rating is out of range")
    return rating


def _count(value: Any) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
        raise ValueError("invalid rating count")
    return value


def build_public_document(
    lookup_payload: Any,
    reviews_payload: Any,
    *,
    generated_at: datetime | None = None,
) -> dict[str, Any]:
    if not isinstance(lookup_payload, dict):
        raise ValueError("invalid lookup payload")
    results = lookup_payload.get("results")
    if not isinstance(results, list):
        raise ValueError("lookup results are missing")
    app = next(
        (
            item
            for item in results
            if isinstance(item, dict)
            and item.get("trackId") == APP_ID
            and item.get("bundleId") == BUNDLE_ID
        ),
        None,
    )
    if app is None:
        raise ValueError("BastCare lookup result is missing")

    average = _rating(app.get("averageUserRating"))
    rating_count = _count(app.get("userRatingCount"))
    version = _required_text(app.get("version"), maximum=32)

    if not isinstance(reviews_payload, dict):
        raise ValueError("invalid reviews payload")
    feed = reviews_payload.get("feed")
    if not isinstance(feed, dict):
        raise ValueError("review feed is missing")
    entries = feed.get("entry", [])
    if isinstance(entries, dict):
        entries = [entries]
    if not isinstance(entries, list):
        raise ValueError("review entries are invalid")

    reviews: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    for entry in entries:
        if not isinstance(entry, dict) or "im:rating" not in entry:
            continue
        review_id = _required_text(_label(entry.get("id")), maximum=80)
        if review_id in seen_ids:
            continue
        author = entry.get("author")
        if not isinstance(author, dict):
            raise ValueError("review author is missing")
        review_rating_text = _label(entry.get("im:rating"))
        if not review_rating_text.isdigit():
            raise ValueError("review rating is invalid")
        review_rating = int(review_rating_text)
        if not 1 <= review_rating <= 5:
            raise ValueError("review rating is out of range")
        body = _required_text(_label(entry.get("content")), maximum=4000)
        review = {
            "id": review_id,
            "title": _required_text(_label(entry.get("title")), maximum=180),
            "excerpt": _excerpt(body),
            "author": _required_text(_label(author.get("name")), maximum=120),
            "rating": review_rating,
            "version": _required_text(_label(entry.get("im:version")), maximum=32),
            "updatedAt": _utc_timestamp(_label(entry.get("updated"))),
        }
        seen_ids.add(review_id)
        reviews.append(review)
        if len(reviews) >= MAX_REVIEWS:
            break

    if len(reviews) > rating_count:
        raise ValueError("written review count exceeds rating count")

    now = generated_at or datetime.now(timezone.utc)
    if now.tzinfo is None:
        raise ValueError("generated_at must include a timezone")
    generated = now.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return {
        "schemaVersion": 1,
        "generatedAt": generated,
        "storefront": STOREFRONT,
        "app": {
            "id": APP_ID,
            "bundleId": BUNDLE_ID,
            "version": version,
            "appStoreUrl": APP_STORE_URL,
        },
        "rating": {
            "average": average,
            "count": rating_count,
            "writtenReviewCount": len(reviews),
        },
        "reviews": reviews,
    }


def _fetch_json(url: str) -> Any:
    request = Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "bastcare-public-reviews/1",
        },
        method="GET",
    )
    with urlopen(request, timeout=20) as response:
        if response.status != 200:
            raise RuntimeError("Apple public feed returned a non-success status")
        body = response.read(MAX_RESPONSE_BYTES + 1)
    if len(body) > MAX_RESPONSE_BYTES:
        raise ValueError("Apple public feed response is too large")
    return json.loads(body)


def _write_atomic(path: Path, document: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(document, indent=2, ensure_ascii=False) + "\n"
    with tempfile.NamedTemporaryFile(
        "w", encoding="utf-8", dir=path.parent, delete=False
    ) as handle:
        handle.write(payload)
        temporary = Path(handle.name)
    temporary.chmod(0o644)
    os.replace(temporary, path)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument(
        "--minimum-written-reviews",
        type=int,
        default=1,
        help="Keep the last verified snapshot if Apple's feed is unexpectedly empty.",
    )
    args = parser.parse_args(argv)

    try:
        document = build_public_document(
            _fetch_json(LOOKUP_URL),
            _fetch_json(REVIEWS_URL),
        )
        if document["rating"]["writtenReviewCount"] < args.minimum_written_reviews:
            raise ValueError("review feed failed the minimum-count safeguard")
        _write_atomic(args.output, document)
    except Exception as exc:
        print(
            f"ERROR: App Store review refresh failed ({type(exc).__name__})",
            file=sys.stderr,
        )
        return 1

    print(f"Wrote App Store review snapshot to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
