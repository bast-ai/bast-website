# Cutover Runbook: replace Webflow bast.ai with the Duplo static site

Date: 2026-07-02
Owner: Beth (has Duplo + Bitbucket access)
Companion reference: [deployment.md](./deployment.md)

Goal: stand the new static site up on DuploCloud (dev, then prod), point
`www.bast.ai` at it, and retire Webflow — with near-zero downtime because prod
is staged before DNS changes.

Deploy is **manual**: the `deploy-current-branch` custom pipeline in Bitbucket.
Branch → environment mapping (from `bitbucket-pipelines.yml`):

| Branch | Service | Tenant | URL | robots |
|--------|---------|--------|-----|--------|
| `dev`  | `dev-bast-website`  | `dev-shared`  | `https://dev-bast-website.aws.bast.ai` | noindex |
| `main` | `prod-bast-website` | `prod-shared` | `https://www.bast.ai` | index |

---

## Phase 1 — One-time provisioning (Beth, in Duplo + Bitbucket)

1. **ECR repo** — create `bast-website` (region `us-east-1`).
2. **Duplo services** (nginx container, container port `8080`, health path `/health`):
   - `dev-bast-website` in tenant `dev-shared`, with an ingress → `dev-bast-website.aws.bast.ai`.
   - `prod-bast-website` in tenant `prod-shared`, with an ingress + TLS cert
     that covers **both `www.bast.ai` and `bast.ai`**.
   - Any starter image is fine at creation; the pipeline replaces it via
     `duploctl service update_image`.
3. **Bitbucket repository variables** (Repo settings → Pipelines → Repository
   variables), mark **Secured**:
   - `DUPLO_HOST` — your DuploCloud base URL
   - `DUPLO_TOKEN` — Duplo API token
   - `ECR_REGISTRY` — e.g. `<acct>.dkr.ecr.us-east-1.amazonaws.com`
   - `GA_MEASUREMENT_ID` — see Phase 2.

## Phase 2 — Take over the existing Bast GA4 property (Beth)

1. Find the existing Bast measurement ID (`G-XXXXXXXXXX`): GA Admin →
   Data Streams → Web → the Bast stream, or the GA snippet in the Webflow
   project settings.
2. Confirm you have **Admin** on that GA4 property (transfer ownership if needed).
3. Set it as the `GA_MEASUREMENT_ID` Bitbucket variable.
   - It must NOT be the Beth Rudden site's ID `G-FL8JCB0PXZ` — `scripts/check.mjs`
     will fail the build if that string appears.
4. Note the behavior change to validate later: the new site loads GA **only
   after the visitor allows analytics** (consent mode defaults to denied),
   unlike Webflow's likely always-on GA. Same property = continuous history.

## Phase 3 — Deploy to DEV and validate (Beth triggers, we validate)

1. Make sure the `dev` branch has the current site (it's created and pushed).
2. Bitbucket → Pipelines → **Run pipeline** → branch `dev` → custom:
   `deploy-current-branch`.
3. Validate at `https://dev-bast-website.aws.bast.ai` against the checklist below.

## Phase 4 — Stage PROD on Duplo (before DNS)

1. `main` already has the site.
2. Run the `deploy-current-branch` custom pipeline on **`main`**.
3. Validate via the Duplo/ALB hostname **directly** (before DNS): prod robots =
   `index, follow`, prod GA id present, TLS valid.

## Phase 5 — DNS cutover (GoDaddy)

1. **24h before:** lower the TTL on the `www` (and apex) records.
2. Point `www.bast.ai` at the Duplo/ALB target for `prod-bast-website`.
   Apex `bast.ai` per the record type Duplo/ALB provides; nginx already
   301-redirects `bast.ai → www.bast.ai`.
3. Verify propagation, TLS, and redirects. **Keep Webflow live until verified.**
4. Once verified, decommission the Webflow site.

## Validation checklist (run on dev, then prod)

- [ ] Home renders fully; no console errors; no horizontal overflow (mobile)
- [ ] Contact form validates + composes email; gated PDFs download
- [ ] Consent banner appears (GA configured); GA events fire only **after** consent
- [ ] `robots` meta + `X-Robots-Tag` header correct for the env
- [ ] `sitemap.xml` `SITE_URL` is correct; `/health` returns `ok`
- [ ] `404.html` serves on unknown paths; `bast.ai → www.bast.ai` redirects (prod)
- [ ] TLS cert covers `www.bast.ai` and `bast.ai` (prod)

## Post-launch (deferred by decision)

Only after the site is fully live on Duplo with real GA:
- EU cookie-consent review + accessibility (WCAG 2.2 AA) audit.
- Wire real lead capture (`window.BAST_LEAD_ENDPOINT`) for the contact form and
  gated downloads, and update `privacy.html` accordingly.
