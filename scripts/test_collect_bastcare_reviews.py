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


def lookup_payload(*, count: int = 6, average: float = 5.0):
    return {
        "resultCount": 1,
        "results": [
            {
                "trackId": MODULE.APP_ID,
                "bundleId": MODULE.BUNDLE_ID,
                "version": "1.0.6",
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


class BastCareReviewCollectorTests(unittest.TestCase):
    def test_builds_allowlisted_public_document(self):
        generated = datetime(2026, 9, 1, 19, 30, tzinfo=timezone.utc)
        result = MODULE.build_public_document(
            lookup_payload(),
            {"feed": {"entry": [review_entry()]}},
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

    def test_truncates_review_excerpt_at_word_boundary(self):
        body = " ".join(f"word{index}" for index in range(30))
        result = MODULE.build_public_document(
            lookup_payload(),
            {"feed": {"entry": [review_entry(body=body)]}},
        )

        excerpt = result["reviews"][0]["excerpt"]
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
