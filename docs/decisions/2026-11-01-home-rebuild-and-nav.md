# Home page rebuild and one site navigation

Date: 2026-11-01
Owner: Beth
Status: Approved for this pull request

## Decision

Beth approved the home page rebuild and a single header and footer.

- The home page leads with BastCare: download, how it helps, proof (Maryville and Lurie Cancer Center at Northwestern), the rewritten DVC card, care-team pilots, the paid R&D strip, and a Substack follow link. The contact form stays on the home page, with the same fields, until a later pull request switches its backend.
- The platform deep-dive moves to `/platform/`: the infrastructure introduction, Answer / Refuse / Trace, the technology stack, the 70–85% token claim, the console screenshots, and the control list. The three product demos stay on `/demos/`.
- `/pilot/` is for care teams and health systems, and it uses the same header and footer as the rest of the site.
- "Evidence" in navigation means the research library at `/evidence/`. The claim register at `/platform/evidence/` is labeled "Claims and proof." `/platform/demo/` stays "Demo guide." "How BastCare works" points at `/bastcare/architecture/`.
- The newsletter follow link goes to Substack (`https://bastai.substack.com`). A Brevo newsletter form needs a backend list before it can replace that link. This pull request does not add a form.
- Lurie Cancer Center (Northwestern) is the production client named on the home page. Craig Hospital stays a Bast AI platform pilot, named on the About page and in the manifesto, and is not described as a BastCare site.

The About page Cynefin section is unchanged.
