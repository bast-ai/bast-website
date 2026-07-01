# Decision: Adopt the Bast Design System on the Website

Date: 2026-07-01

## Decision

Restyle the public website to the Bast design system (`@bast/shared-styles`,
maintained by Adam Cutler in `bast-admin-ui`) instead of the generic
black/white/Helvetica look the initial shell shipped with. Concretely:

- Use the design-system tokens: `#dde3e9` paper, `#0d2935` slate ink,
  the `#0090cc -> #3c54a1` brand gradient, neumorphic surfaces, and the
  Estedad display typeface (thin weights for headings).
- Recolor the logo from the off-brand cyan (`#1c96c6`) to the brand gradient.
- **Self-host** the Estedad font as subsetted `woff2` files in
  `src/assets/fonts/` rather than loading it from Google Fonts.

## Why

- One brand. The site should look like the product (admin-ui / chat-ui), which
  already renders from `@bast/shared-styles`. Values were copied from that
  package so the two stay in sync.
- Reuse existing assets and patterns before inventing new ones — the tokens,
  gradient, and type ramp already exist and are maintained elsewhere.
- Self-hosting the font keeps the privacy posture intact: analytics are gated
  behind consent, so the site should not make an uncredited third-party request
  to `fonts.googleapis.com` / `fonts.gstatic.com` on every page load. The
  platform apps load Estedad from Google Fonts; the public marketing site
  deliberately does not.

## Consequences

- ~70 KB of vendored font binaries (6 weights, latin subset) live in the repo.
  Estedad is OFL-licensed, so redistribution is fine.
- Token values are duplicated (copied), not imported. If the design system
  changes a core color or the type ramp, the website CSS must be updated by
  hand. Acceptable for a small static site; revisit if drift becomes a problem.
- The look now depends on Estedad loading; a system-ui fallback stack is in
  place with `font-display: swap` so text is always legible.

## Open Items

- If/when the design system publishes a distributable token file (CSS custom
  properties), consider importing it instead of hand-copying values.
- Consider adding more Estedad subsets if non-latin content is ever needed.
