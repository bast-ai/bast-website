# Deployment Notes

## Intended Shape

- Bitbucket repo: `bastai/bast-website`
- Image: `${ECR_REGISTRY}/bast-website:<env>-<short-sha>`
- Runtime: nginx on container port `8080`
- Health check: `/health`
- Dev service: `dev-bast-website` in `dev-shared`
- Production service: `prod-bast-website` in `prod-shared`

Confirm the service and tenant names in DuploCloud before the first pipeline
run. The names above are starter defaults.

## GoDaddy Cutover

Do not change GoDaddy DNS until the Duplo production ingress is live and has a
stable target.

Expected final DNS pattern:

- `www.bast.ai` points to the public Duplo/ALB hostname for the production
  website service.
- `bast.ai` redirects to `www.bast.ai`.

The exact GoDaddy record type depends on the target Duplo/ALB value available
at cutover time.

## GA4

Use a dedicated Bast GA4 property or web data stream. Set the Bitbucket
deployment variable:

```bash
GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Do not reuse the Beth Rudden site measurement ID.
