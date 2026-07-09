# Decision: cut `www.bast.ai` DNS over from Webflow to GitHub Pages

Date: 2026-07-08
Status: Accepted (executes the DNS step deferred in the 2026-07-06 GitHub Pages note)
Owner: Beth (has GoDaddy + repo admin)

## Context

The new static site is built and **live on GitHub Pages** at
`https://bast-ai.github.io/bast-website/`. The Actions build+deploy succeeds, the
contact form is wired to Web3Forms and verified end-to-end (test submission
reached Beth's inbox), and `src/CNAME` pins `www.bast.ai` so the custom domain
survives every deploy.

The public domain, however, still resolves to the **old Webflow site**:

- `www.bast.ai` → CNAME `cdn.webflow.com`
- `bast.ai` (apex) → A `198.202.211.1` (GoDaddy)

This is the final go-live step: repoint DNS so visitors to `www.bast.ai` get the
new GitHub Pages site.

## Decision

At GoDaddy, replace the Webflow DNS records with GitHub Pages records. Canonical
host is `www.bast.ai` (matches `src/CNAME`); apex `bast.ai` redirects to it.

| Type  | Host  | Old value            | New value                                                                 |
|-------|-------|----------------------|---------------------------------------------------------------------------|
| CNAME | `www` | `cdn.webflow.com`    | `bast-ai.github.io`                                                        |
| A     | `@`   | `198.202.211.1`      | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` |

Remove any other Webflow-specific records (e.g. a Webflow TXT verification
record) once the switch is confirmed. Keep the GitHub Pages custom domain set to
`www.bast.ai` and enable **Enforce HTTPS** after the Let's Encrypt cert
provisions (minutes to ~24h after DNS propagates).

## Rollback

Fully reversible at DNS: restore `www` CNAME → `cdn.webflow.com` and apex A →
`198.202.211.1`. Do **not** delete the Webflow project until the new site has been
verified live on the domain for a sensible window.

## Sequencing / verification

1. (Optional, day before) Lower the TTL on the `www` and apex records so the
   switch propagates fast.
2. Confirm GitHub repo → Settings → Pages shows Custom domain `www.bast.ai`.
3. Make the record changes above at GoDaddy.
4. Wait for propagation; verify `www.bast.ai` serves the new site (not Webflow)
   and the contact form + PDF links work on the live domain.
5. Enable Enforce HTTPS in Pages settings once the cert is issued.
6. Remove leftover Webflow DNS records; retire the Webflow project after a
   verification window.

## Notes

- No custom HTTP security headers on Pages (unchanged tradeoff from the
  2026-07-06 note); front with Cloudflare later if edge headers are needed.
- Analytics unchanged: GA4 loads only on consent, reusing the Bast GA4 property.
