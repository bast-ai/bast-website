# BastCare page nits from 4 November

Date: 2026-11-05
Owner: Beth
Status: Approved for this pull request

## Decision

Beth marked fifteen BastCare page changes on 4 November 2026. This pull request follows them.

- BastCare marketing copy says what the product does. Fictional-demo lines, "not medical advice," "not a medical device," and "AI may contain errors" leave the product page. The medical-device statement stays in the legal page.
- Every download CTA uses the App Store event install link `https://apps.apple.com/us/app/id6789669565?eventid=6830210433`.
- Saved summaries are described as nine languages, including Filipino and Japanese.
- Footer "How BastCare works" is removed. `/bastcare/architecture/` stays in the repo, with `noindex` and no public link, until that material sits behind the contact form.
- Privacy, Privacy Q&A, Terms, and Processors are one legal page at `/bastcare/privacy/`. The old URLs redirect:
  - `/bastcare/privacy-faq/` → `/bastcare/privacy/#privacy-qa`
  - `/bastcare/terms/` → `/bastcare/privacy/#terms`
  - `/bastcare/processors/` → `/bastcare/privacy/#processors`
- Delete account stays its own page. The footer medical-device line stays on the legal page and on BastCare support.
