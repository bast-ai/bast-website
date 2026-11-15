# Evidence library browser pass

Date: 2026-11-10
Owner: Beth
Status: Approved for this pull request

## Decision

Beth approved a 30-day pass in the reader's own browser on 10 November 2026.
This supersedes the 31 October decision that the confirmation token is never stored.

- After a successful library load, the page stores the token in `localStorage`
  under `bast_evidence_pass` for 30 days. An expiry returned by the server, or
  the token's own `exp` if the server does not send one, is used when it is
  sooner. The token is not a cookie.
- A later visit with no `?t=` uses that stored token. A 401 or 403, or a pass
  that has run out, clears it and shows the existing expired message.
- The unlocked library has a Forget this browser control that removes the pass.
- The gate service is unchanged. Its signed token still expires in 7 days, so
  the stored pass cannot outlive that token until the service extends `exp`.
