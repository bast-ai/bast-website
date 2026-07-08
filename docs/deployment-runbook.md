# Cutover Runbook: replace Webflow bast.ai with the GitHub Pages static site

Date: 2026-07-06
Owner: Beth (has GoDaddy + repo admin)
Decision: [2026-07-06-github-pages-hosting.md](./decisions/2026-07-06-github-pages-hosting.md)
Companion reference: [deployment.md](./deployment.md)

Goal: publish the static site to GitHub Pages, point `www.bast.ai` at it, and
retire Webflow — with near-zero downtime because Webflow stays live until the
new site is verified.

Deploy is **automatic**: the `.github/workflows/deploy.yml` workflow builds and
publishes on every push to `main` (and can be run manually from the Actions
tab). There is no container, no Duplo, no ECR.

Assumed GitHub owner: `bast-ai` → Pages host `bast-ai.github.io`. Confirm this
before touching DNS; it is the value GoDaddy points at.

---

## Phase 1 — GitHub repo + Pages (Beth)

1. Create/confirm the GitHub repo `bast-ai/bast-website` and push this branch
   (main). Keep Bitbucket as a mirror if you like; GitHub is now the deploy
   source of truth.
2. Repo → **Settings → Pages** → Source: **GitHub Actions**.
3. Repo → **Settings → Secrets and variables → Actions → Variables** → add
   repository variable `GA_MEASUREMENT_ID = G-XXXXXXXXXX` (see Phase 2).

## Phase 2 — Take over the existing Bast GA4 property (Beth)

1. Find the existing Bast measurement ID (`G-XXXXXXXXXX`): GA Admin →
   Data Streams → Web → the Bast stream, or the GA snippet in the Webflow
   project settings.
2. Confirm you have **Admin** on that GA4 property (transfer ownership if needed).
3. Set it as the `GA_MEASUREMENT_ID` Actions variable.
   - It must NOT be the Beth Rudden site's id `G-FL8JCB0PXZ` — `scripts/check.mjs`
     fails the build if that string appears.
4. Behavior to validate later: the site loads GA **only after the visitor
   allows analytics** (consent defaults to denied). Same property = continuous
   history.

## Phase 3 — First deploy + validate on the Pages URL (before DNS)

1. Push to `main` (or Actions tab → Deploy to GitHub Pages → Run workflow).
2. Watch the Actions run go green.
3. Validate against the checklist below. Before DNS, the live URL is the Pages
   default (`https://bast-ai.github.io/bast-website/`). Note: absolute `/assets/`
   paths render at root once the custom domain is live; on the project-page
   subpath some assets/links may 404 — that's expected pre-cutover. For a clean
   pre-DNS check, either add the custom domain first (Phase 4) and validate via
   a local hosts-file override, or accept a low-TTL staged DNS cutover.

## Phase 4 — Custom domain + DNS cutover (GitHub Pages + GoDaddy)

1. Repo → Settings → Pages → **Custom domain** → `www.bast.ai` → Save.
   (`src/CNAME` already pins this in every build, so it persists across deploys.)
2. **24h before:** lower the TTL on the `www` and apex records in GoDaddy.
3. GoDaddy DNS:
   - `www.bast.ai` → **CNAME** → `bast-ai.github.io`
   - `bast.ai` (apex) → **A** records to GitHub Pages:
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
     (optionally AAAA: `2606:50c0:8000::153`, `...8001::153`, `...8002::153`, `...8003::153`)
   - GitHub Pages auto-redirects apex `bast.ai` → `www.bast.ai` once both resolve.
4. Back in Settings → Pages, wait for the TLS cert to provision, then tick
   **Enforce HTTPS**.
5. Verify propagation, TLS, and the apex→www redirect. **Keep Webflow live until
   verified.**
6. Once verified, decommission the Webflow site.

## Validation checklist (Pages URL, then live domain)

- [ ] Home renders fully; no console errors; no horizontal overflow (mobile)
- [ ] Contact form validates + composes email; gated PDFs download
- [ ] Consent banner appears (GA configured); GA events fire only **after** consent
- [ ] `<meta name="robots">` is `index, follow` on the live production site
- [ ] `sitemap.xml` `SITE_URL` is correct
- [ ] `404.html` serves on unknown paths (GitHub Pages serves it automatically)
- [ ] Custom domain resolves; `bast.ai → www.bast.ai` redirect works
- [ ] TLS valid on `www.bast.ai` and `bast.ai`; **Enforce HTTPS** is on

## Notes / tradeoffs

- GitHub Pages cannot set custom HTTP headers, so the nginx security headers
  (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`, `X-Robots-Tag`) are not emitted. Indexing is controlled
  by the meta tag. To restore edge headers later, front Pages with Cloudflare or
  move to Cloudflare Pages. See the decision note.

## Post-launch (deferred by decision)

Only after the site is fully live with real GA:
- EU cookie-consent review + accessibility (WCAG 2.2 AA) audit.
- Wire real lead capture (`window.BAST_LEAD_ENDPOINT`) for the contact form and
  gated downloads, and update `privacy.html` accordingly.
