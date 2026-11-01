# Site cleanup from the October review

Date: 2026-11-01
Owner: Beth
Status: Approved for this pull request

## Decision

Beth approved one cleanup of the public site:

- BastCare asks for consent before recording. The app does not enforce consent, and public copy does not say recording waits for agreement.
- The home contact form stays on Web3Forms. The privacy policy names Web3Forms (Web3Creative) and links its privacy policy. The form endpoint stays `https://api.web3forms.com/submit` until a later pull request, after a Brevo-backed contact endpoint is deployed.
- In-app purchases are on hold. Public pages, `llms.txt`, the FAQ, and structured data do not describe BastCare Plus, subscriptions, included hours, or a price.
- Craig Hospital stays. Beth later confirmed the Bast AI platform pilot there. The manifesto names that pilot and says BastCare did not exist then. `bast-narrative.pdf` stays published. The manifesto links the Bob Beth retelling PDF.
- Say "free to download." Buttons say "Download BastCare."
- `/about/` is the story page. It includes the team: Beth Rudden is CEO, Thanh Lam is CTO, and a line names a wider team of contributors without listing them. `/team/` is a noindex redirect to `/about/#team` and is not in the sitemap. The home About section, the footer Team link, and the footer About link point at `/about/` or `/about/#team`. The footer has no individual names.
- The About page describes Dave Snowden's Cynefin framework (clear, complicated, complex, chaotic, with confusion or disorder at the center). Beth approved that section as written.
- The About timeline is Beth's account: incorporation in October 2022, client pilots in 2023, commercialized developer tools and production client work in 2024, the Craig Hospital platform pilot and platform commercialization in 2025, the BastCare alpha in August 2026, the evidence library on 31 October 2026, and BastCare pilots for care teams in November 2026. MSU Denver is not on the timeline.
- Public pages do not print a BastCare version number. Ratings still come from the App Store snapshot. The snapshot keeps its version field for the review queue.
- `/platform/evidence/` stays as the claim register. `/evidence/` stays in the main nav.
- Body, card, caption, and label text is at least 18px, in near-black, with heading weight 600 or heavier.
- `/evidence/` is in the main nav and the company footer.

Maryville University and its case-study PDF stay as they are. MSU Denver is unchanged.
