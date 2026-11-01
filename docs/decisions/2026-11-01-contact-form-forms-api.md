# Home contact form uses Bast's forms API

Date: 2026-11-01
Owner: Beth
Status: Proposed (final sign-off is this PR)

## Context

The home contact form posted to Web3Forms with a public access key, and
opened the visitor's email app when that send failed. The evidence library
sign-up already posts JSON to Bast's forms service at
`https://forms.aws.bast.ai`. That script uses this one origin for every
build, including local preview. It does not switch hosts. The staging forms
host is `https://dev-forms.aws.bast.ai`.

## Decision

- The home form posts `{name, email, message, website, updates}` to
  `POST https://forms.aws.bast.ai/contact`, the same origin and fetch style
  as the evidence sign-up. `website` is an off-screen honeypot. `updates` is
  an optional boolean from an unticked checkbox labeled "Send me Bast
  updates".
- Web3Forms, its access key, and the email-app fallback are removed.
  `scripts/check.mjs` fails if `web3forms` appears anywhere under `src/`.
- `/privacy.html` says contact messages are delivered by Bast's own server
  through Brevo (Sendinblue SAS) by email to Bast. If the person ticks the
  updates box, their name and email are kept in Brevo to send Bast updates,
  and they can unsubscribe at any time.
