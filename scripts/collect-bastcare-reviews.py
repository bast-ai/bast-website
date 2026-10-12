#!/usr/bin/env python3
"""Fetch a privacy-safe public BastCare App Store snapshot and review queue.

Default mode (deploy job): call Apple's public lookup and customer-review
feeds and write the same-origin JSON the site loads. Version, average rating,
and counts come from Apple on every deploy. Review text is published only when
its id is in data/bastcare-reviews/approved.json, so a new App Store review
never appears on bast.ai until Beth approves it.

--queue mode (scheduled review-queue workflow): add reviews Apple lists that
are not yet approved, pending, or rejected to pending.json, record the App
Store version seen, and write a Markdown summary for the pull request body.
It flags when the approved release-notes copy on /bastcare/ is for an older
version. It never edits approved.json or page copy.

Visitors load only the resulting same-origin JSON file, so viewing the Bast
website does not disclose their IP address or browser details to Apple.
"""

from __future__ import annotations

import argparse
import json
import os
import re
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
QUEUE_DIR = Path("data/bastcare-reviews")
BASTCARE_PAGE = Path("src/bastcare/index.html")
RELEASE_NOTES_PATTERN = re.compile(r'data-bastcare-release-notes-version="([0-9.]+)"')
PUBLIC_REVIEW_FIELDS = ("id", "title", "excerpt", "rating", "version", "updatedAt")
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


def _version(value: Any) -> str:
    version = _required_text(value, maximum=32)
    parts = version.split(".")
    if not 2 <= len(parts) <= 4 or not all(part.isdigit() for part in parts):
        raise ValueError("app version is not a dotted number")
    return version


def lookup_app(lookup_payload: Any) -> dict[str, Any]:
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
    return {
        "average": _rating(app.get("averageUserRating")),
        "count": _count(app.get("userRatingCount")),
        "version": _version(app.get("version")),
    }


def parse_feed_reviews(reviews_payload: Any) -> list[dict[str, Any]]:
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
        review_rating_text = _label(entry.get("im:rating"))
        if not review_rating_text.isdigit():
            raise ValueError("review rating is invalid")
        review_rating = int(review_rating_text)
        if not 1 <= review_rating <= 5:
            raise ValueError("review rating is out of range")
        body = _required_text(_label(entry.get("content")), maximum=4000)
        review = {
            "id": review_id,
            "storefront": STOREFRONT,
            "title": _required_text(_label(entry.get("title")), maximum=180),
            "excerpt": _excerpt(body),
            "rating": review_rating,
            "version": _required_text(_label(entry.get("im:version")), maximum=32),
            "updatedAt": _utc_timestamp(_label(entry.get("updated"))),
        }
        seen_ids.add(review_id)
        reviews.append(review)
        if len(reviews) >= MAX_REVIEWS:
            break
    return reviews


def published_reviews(approved_reviews: Any) -> list[dict[str, Any]]:
    """Approved U.S. carousel reviews, newest first, public fields only.

    The featured Australian review is hand-placed HTML on /bastcare/, so it is
    tracked in approved.json for provenance but excluded from the carousel.
    """
    if not isinstance(approved_reviews, (list, tuple)):
        raise ValueError("approved reviews must be a list")
    published = []
    for review in approved_reviews:
        if not isinstance(review, dict):
            raise ValueError("approved review is invalid")
        if review.get("storefront") != STOREFRONT or review.get("placement") == "featured":
            continue
        published.append({field: review[field] for field in PUBLIC_REVIEW_FIELDS})
    published.sort(key=lambda review: review["updatedAt"], reverse=True)
    return published


def build_public_document(
    lookup_payload: Any,
    reviews_payload: Any,
    *,
    approved_reviews: Any = (),
    generated_at: datetime | None = None,
) -> dict[str, Any]:
    app = lookup_app(lookup_payload)
    feed_reviews = parse_feed_reviews(reviews_payload)
    if len(feed_reviews) > app["count"]:
        raise ValueError("written review count exceeds rating count")
    reviews = published_reviews(approved_reviews)
    if len(reviews) > app["count"]:
        raise ValueError("approved review count exceeds rating count")

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
            "version": app["version"],
            "appStoreUrl": APP_STORE_URL,
        },
        "rating": {
            "average": app["average"],
            "count": app["count"],
            # Apple's written-review count; "reviews" holds only approved ones.
            "writtenReviewCount": len(feed_reviews),
        },
        "reviews": reviews,
    }


def release_notes_version(page_html: str) -> str | None:
    match = RELEASE_NOTES_PATTERN.search(page_html)
    return match.group(1) if match else None


def update_queue(
    lookup_payload: Any,
    reviews_payload: Any,
    *,
    approved: dict[str, Any],
    pending: dict[str, Any],
    rejected: dict[str, Any],
    page_html: str,
    queued_at: datetime | None = None,
) -> tuple[dict[str, Any], list[str]]:
    """Return the new pending document and Markdown summary lines."""
    app = lookup_app(lookup_payload)
    feed_reviews = parse_feed_reviews(reviews_payload)
    known = {
        str(review.get("id"))
        for document in (approved, pending, rejected)
        for review in document.get("reviews", [])
    }
    now = (queued_at or datetime.now(timezone.utc)).astimezone(timezone.utc)
    stamp = now.strftime("%Y-%m-%dT%H:%M:%SZ")
    new_reviews = [
        {**review, "queuedAt": stamp}
        for review in feed_reviews
        if review["id"] not in known
    ]

    updated = dict(pending)
    updated["appStoreVersionSeen"] = app["version"]
    updated["reviews"] = list(pending.get("reviews", [])) + new_reviews

    summary: list[str] = []
    if new_reviews:
        summary.append(f"### {len(new_reviews)} new App Store review(s) added to pending")
        summary.append("")
        for review in new_reviews:
            summary.append(
                f"- **{review['title']}** ({review['rating']}★, version {review['version']}, "
                f"{review['updatedAt'][:10]}): {review['excerpt']}"
            )
        summary.append("")
    waiting = len(updated["reviews"])
    summary.append(f"Reviews waiting in `data/bastcare-reviews/pending.json`: {waiting}.")
    summary.append("")

    notes_version = release_notes_version(page_html)
    if pending.get("appStoreVersionSeen") != app["version"]:
        summary.append(
            f"### App Store version changed: {pending.get('appStoreVersionSeen') or 'unknown'} → {app['version']}"
        )
        summary.append("")
        summary.append(
            "Version text on bast.ai updates automatically on the next deploy. "
            "Release notes do not."
        )
        summary.append("")
    if notes_version != app["version"]:
        summary.append(
            f"**Release notes need review:** /bastcare/ shows approved notes for "
            f"{notes_version or 'no version'}, but the App Store is on {app['version']}. "
            "Update the \"New in\" copy by hand if you want it to change."
        )
        summary.append("")
    return updated, summary


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


def _read_json(path: Path) -> dict[str, Any]:
    document = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(document, dict) or document.get("schemaVersion") != 1:
        raise ValueError(f"{path} is not a schemaVersion 1 document")
    if not isinstance(document.get("reviews"), list):
        raise ValueError(f"{path} has no reviews list")
    return document


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
    parser.add_argument("--queue-dir", type=Path, default=QUEUE_DIR)
    parser.add_argument(
        "--queue",
        action="store_true",
        help="Update pending.json with new reviews instead of writing the public snapshot.",
    )
    parser.add_argument(
        "--summary",
        type=Path,
        help="With --queue, write a Markdown summary for the pull request body here.",
    )
    parser.add_argument(
        "--minimum-written-reviews",
        type=int,
        default=1,
        help="Keep the last verified snapshot if Apple's feed is unexpectedly empty.",
    )
    args = parser.parse_args(argv)

    try:
        lookup_payload = _fetch_json(LOOKUP_URL)
        reviews_payload = _fetch_json(REVIEWS_URL)
        approved = _read_json(args.queue_dir / "approved.json")
        if args.queue:
            pending_path = args.queue_dir / "pending.json"
            pending, summary = update_queue(
                lookup_payload,
                reviews_payload,
                approved=approved,
                pending=_read_json(pending_path),
                rejected=_read_json(args.queue_dir / "rejected.json"),
                page_html=BASTCARE_PAGE.read_text(encoding="utf-8"),
            )
            _write_atomic(pending_path, pending)
            if args.summary:
                args.summary.write_text("\n".join(summary) + "\n", encoding="utf-8")
            print(f"Updated review queue in {pending_path}")
            return 0

        document = build_public_document(
            lookup_payload,
            reviews_payload,
            approved_reviews=approved["reviews"],
        )
        if document["rating"]["writtenReviewCount"] < args.minimum_written_reviews:
            raise ValueError("review feed failed the minimum-count safeguard")
        if not document["reviews"]:
            raise ValueError("no approved reviews to publish")
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
