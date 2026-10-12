from __future__ import annotations

import importlib.util
import unittest
from datetime import datetime, timezone
from pathlib import Path


SCRIPT = Path(__file__).with_name("collect-bastcare-reviews.py")
SPEC = importlib.util.spec_from_file_location("collect_bastcare_reviews", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


def lookup_payload(*, count: int = 6, average: float = 5.0, version: str = "1.0.6"):
    return {
        "resultCount": 1,
        "results": [
            {
                "trackId": MODULE.APP_ID,
                "bundleId": MODULE.BUNDLE_ID,
                "version": version,
                "averageUserRating": average,
                "userRatingCount": count,
            }
        ],
    }


def review_entry(
    review_id: str = "123",
    body: str = "A clear and useful review.",
):
    return {
        "author": {"name": {"label": "Reviewer"}},
        "updated": {"label": "2026-08-28T14:33:21-07:00"},
        "im:rating": {"label": "5"},
        "im:version": {"label": "1.0.5"},
        "id": {"label": review_id},
        "title": {"label": "Very helpful"},
        "content": {"label": body},
    }


def approved_review(review_id: str = "123", **extra):
    review = {
        "id": review_id,
        "storefront": "us",
        "title": "Very helpful",
        "excerpt": "A clear and useful review.",
        "rating": 5,
        "version": "1.0.5",
        "updatedAt": "2026-08-28T21:33:21Z",
        "approvedAt": "2026-10-12",
    }
    review.update(extra)
    return review


def empty(**extra):
    return {"schemaVersion": 1, "reviews": [], **extra}


class BastCareReviewCollectorTests(unittest.TestCase):
    def test_builds_allowlisted_public_document(self):
        generated = datetime(2026, 9, 1, 19, 30, tzinfo=timezone.utc)
        result = MODULE.build_public_document(
            lookup_payload(),
            {"feed": {"entry": [review_entry()]}},
            approved_reviews=[approved_review()],
            generated_at=generated,
        )

        self.assertEqual(result["schemaVersion"], 1)
        self.assertEqual(result["generatedAt"], "2026-09-01T19:30:00Z")
        self.assertEqual(result["rating"], {
            "average": 5.0,
            "count": 6,
            "writtenReviewCount": 1,
        })
        self.assertEqual(result["reviews"][0]["updatedAt"], "2026-08-28T21:33:21Z")
        self.assertNotIn("results", result)
        self.assertNotIn("content", result["reviews"][0])
        self.assertNotIn("author", result["reviews"][0])
        self.assertNotIn("approvedAt", result["reviews"][0])
        self.assertEqual(result["app"]["version"], "1.0.6")

    def test_publishes_only_approved_reviews(self):
        result = MODULE.build_public_document(
            lookup_payload(),
            {"feed": {"entry": [review_entry("123"), review_entry("456")]}},
            approved_reviews=[approved_review("123")],
        )
        self.assertEqual([review["id"] for review in result["reviews"]], ["123"])
        self.assertEqual(result["rating"]["writtenReviewCount"], 2)

    def test_featured_and_other_storefront_reviews_stay_out_of_carousel(self):
        result = MODULE.build_public_document(
            lookup_payload(),
            {"feed": {"entry": [review_entry()]}},
            approved_reviews=[
                approved_review("123"),
                approved_review("au-1", storefront="au", placement="featured"),
            ],
        )
        self.assertEqual([review["id"] for review in result["reviews"]], ["123"])

    def test_rejects_non_numeric_version(self):
        with self.assertRaises(ValueError):
            MODULE.build_public_document(
                lookup_payload(version="1.0.12<script>"),
                {"feed": {"entry": [review_entry()]}},
            )

    def test_queue_adds_only_unknown_reviews_to_pending(self):
        page = '<section data-bastcare-release-notes-version="1.0.6"></section>'
        pending, summary = MODULE.update_queue(
            lookup_payload(),
            {"feed": {"entry": [
                review_entry("approved"),
                review_entry("pending"),
                review_entry("rejected"),
                review_entry("new"),
            ]}},
            approved=empty(reviews=[approved_review("approved")]),
            pending=empty(appStoreVersionSeen="1.0.6", reviews=[approved_review("pending")]),
            rejected=empty(reviews=[{"id": "rejected"}]),
            page_html=page,
            queued_at=datetime(2026, 10, 12, 23, 0, tzinfo=timezone.utc),
        )
        self.assertEqual([review["id"] for review in pending["reviews"]], ["pending", "new"])
        self.assertEqual(pending["reviews"][1]["queuedAt"], "2026-10-12T23:00:00Z")
        self.assertIn("1 new App Store review", "\n".join(summary))
        self.assertNotIn("version changed", "\n".join(summary))
        self.assertNotIn("Release notes need review", "\n".join(summary))

    def test_queue_flags_version_change_and_stale_release_notes(self):
        page = '<section data-bastcare-release-notes-version="1.0.12"></section>'
        pending, summary = MODULE.update_queue(
            lookup_payload(version="1.0.13"),
            {"feed": {"entry": []}},
            approved=empty(),
            pending=empty(appStoreVersionSeen="1.0.12"),
            rejected=empty(),
            page_html=page,
        )
        text = "\n".join(summary)
        self.assertEqual(pending["appStoreVersionSeen"], "1.0.13")
        self.assertIn("1.0.12 → 1.0.13", text)
        self.assertIn("Release notes need review", text)

    def test_truncates_review_excerpt_at_word_boundary(self):
        body = " ".join(f"word{index}" for index in range(30))
        result = MODULE.parse_feed_reviews(
            {"feed": {"entry": [review_entry(body=body)]}},
        )

        excerpt = result[0]["excerpt"]
        self.assertTrue(excerpt.endswith("…"))
        self.assertEqual(len(excerpt.removesuffix("…").split()), 24)

    def test_deduplicates_feed_entries(self):
        result = MODULE.build_public_document(
            lookup_payload(),
            {"feed": {"entry": [review_entry(), review_entry()]}},
        )
        self.assertEqual(result["rating"]["writtenReviewCount"], 1)

    def test_rejects_mismatched_app(self):
        payload = lookup_payload()
        payload["results"][0]["bundleId"] = "example.invalid"
        with self.assertRaises(ValueError):
            MODULE.build_public_document(
                payload,
                {"feed": {"entry": [review_entry()]}},
            )

    def test_rejects_invalid_rating(self):
        with self.assertRaises(ValueError):
            MODULE.build_public_document(
                lookup_payload(average=6.0),
                {"feed": {"entry": [review_entry()]}},
            )


if __name__ == "__main__":
    unittest.main()
