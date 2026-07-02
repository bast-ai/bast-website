# Content Migration Map: Webflow bast.ai → new static site

Date: 2026-07-01
Source: https://bast.ai (Webflow, single page with anchor nav)
Target: this repo (`src/`, static build)

## 1. Live site structure (source of truth for content)

Single page, anchor navigation. Nav: Safety / Offerings / Features / Contact.
Footer adds Case Studies + LinkedIn.

| # | Section | Heading (live) | Notes |
|---|---------|----------------|-------|
| Hero | `#Hero` | "Safe AI — Your data, your context, your control" | Sub: "While the world was building to scale, Bast was building a trust layer." Partner logos: Maryville, Simwerx, Craig, Northwestern, Metropolitan. |
| Overview | — | "Overview" | Explainable AI on proprietary data; APIs, governance, billing; versioned/auditable pipelines; 70% compute reduction; 8-week deploy. |
| Safety | `#problem` | "Safety isn't a feature, it's the foundation of everything we do" | On-prem/hosted, decision lineage, deterministic outputs, cloud- & LLM-agnostic APIs. "System of record for AI." |
| Offerings | `#offering` | "Our offerings" | 4 modules: AI infrastructure (K8s microservices), Data management (versioned storage + ontological NLU), Orchestration (analysis/chat/search/personalization), Application (end-user integrations). |
| Features | `#features` | "Features" | 6 cards: Hybrid intelligence, Versioned system of record, Attribution/provenance, Speed & efficiency (8-week / 70%), + 2 more. |
| Technologies | — | "Multiple AI technologies, one easy-to-deploy solution" | 6 components: Data pipeline, NLU (controlled vocab), Knowledge graphs, Model Context Protocol, Hybrid intelligence, Explainable UI layer. |
| Why Bast | `#whybast` | "Why Bast" | Transparent, auditable, compliant AI at enterprise scale. |
| Data ownership | — | "Your data, your decisions, your control" | 5 guarantees: IP yours, auditable, traceable, governed, never repurposed. |
| Case studies | — | "Case Studies" | See §3. |
| Contact | `#contact-new` | "Get in touch with us" | Form (email/phone). ⚠️ Live values are template placeholders (`hello@profa.mail`, `+123 3410 00`). |

External: LinkedIn — https://www.linkedin.com/company/bast-ai/

## 2. New site current state (post design-system restyle)

Pages: `index.html`, `investors.html`, `privacy.html`, `404.html`.
Home sections: Hero (3 value-prop lines) · "The shift" · Proof modes (Answer/Refuse/Trace) · Demos (YouTube) · Proof grid (Grounded/Deployable/Efficient/Auditable) · Contact (mailto).

## 3. Case studies to carry over

| Sector | Customer | One-liner | Claim to source |
|--------|----------|-----------|-----------------|
| Healthcare | Craig | Explainable AI for patient/family/provider access | — |
| Healthcare | Simwerx | Offline medic co-pilot with visual protocol proof | — |
| Healthcare | Northwestern Medicine | Ontology-driven lookup for instruments/assays | — |
| Healthcare | (DVC) | Explainable, offline-ready medical AI (already on new site) | DVC blog feature |
| Education | Metropolitan University | AI Student Advisor pilot | — |
| Education | Maryville University | Social learning companions | "12% attrition reduction", "$1.2M saved first semester" |

## 4. Gap analysis — what the new site is missing vs live

- Overview / positioning intro ("trust layer") narrative.
- Offerings (4 modules) section.
- Features (6 cards) — new site has a lighter 4-item proof grid instead.
- AI technologies (6 components) section.
- "Data ownership / your control" section.
- Full case-study set (new site shows DVC + Maryville only; live has 5).
- Partner logo strip (Maryville, Simwerx, Craig, Northwestern, Metropolitan).
- A real contact path (new site uses mailto; live uses a form).

## 5. Open decisions (need Beth / team)

1. **One page or multi-page?** Live is single-page anchors. New site is multi-page
   (investors, privacy separate). Recommend: keep a rich single home page +
   separate investors/privacy, and consider a dedicated `/case-studies`.
2. **Contact: form or mailto?** New site is mailto-only ("no form, no gate" on
   investors). A form is net-new UI + a privacy/consent decision (form data).
3. **Claims to source** before shipping (CLAUDE.md: claims traceable to
   evidence): 70% compute reduction, 8-week deployment, Maryville 12% / $1.2M.
   Need a citation or internal doc for each.
4. **Partner logos** — do we have permission + assets (SVand/or PNG) for
   Maryville, Simwerx, Craig, Northwestern, Metropolitan?
5. **Positioning line** — live leads with "Safe AI"; new site leads with
   "AI that shows its work / Here. It's called Bast." Which is the primary
   message? (Material positioning → human sign-off per CLAUDE.md.)

## 6. Notability / fixes spotted

- Live contact block ships template placeholders (`hello@profa.mail`,
  `+123 3410 00`). Real contact is `hello@bast.ai` (used on the new site).
