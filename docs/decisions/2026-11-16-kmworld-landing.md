# KMWorld landing page

Date: 2026-11-16
Owner: Beth
Status: Proposed (final sign-off is this PR)

## Context

KMWorld and Enterprise AI World meet in Washington, DC, November 16–19, 2026.
A QR on stickers and slides should open a short BastCare page.

## Decision

- `/kmworld/` uses the existing BastCare line, "Retain more of the conversation,
  so you can be present in the room." The visit story matches `/bastcare/`:
  caregivers lose what the doctor said, and BastCare keeps the conversation.
  The offer line is "Free to try right now."
- The App Store button uses
  `https://apps.apple.com/us/app/bastcare/id6789669565?ct=kmworld`.
  This repo has no provider token, so the link carries `ct=kmworld` and
  leaves `pt` and `mt` for App Store Connect. There is no Google Play link.
- Beth Rudden's Enterprise AI World sessions are listed on the page:
  Workshop W5, the Wednesday talk "Explainability Is Infrastructure", and
  the Thursday closing panel. She is Conference Co-Chair.
- The proof row uses the homepage Lurie line ("runs Bast in production",
  "Since 2024"), the Maryville case study (attrition down 26% across 764
  students, graduating nurses up 38%), and library study A39 (Barnado et
  al., NEJM AI; Vanderbilt, 2,385 patients, 138 days to 43).
- The QR encodes
  `https://bast.ai/kmworld/?utm_source=kmworld&utm_medium=qr&utm_campaign=kmworld2026`.
  GA4 stays off until the visitor chooses Allow analytics. The page view then
  sends `utm_source`, `utm_medium`, and `utm_campaign`, and an App Store click
  sends `app_store_click` with the same campaign fields.
- This repo has no Google Play URL, so the page links to the App Store.
