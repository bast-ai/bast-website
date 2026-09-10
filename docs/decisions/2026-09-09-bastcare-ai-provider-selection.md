# BastCare AI provider selection

Date: September 9, 2026

## Context

The BastCare public pages described OpenAI as the sole model-processing provider. BastCare can select either Anthropic or OpenAI for a summary request, so the existing copy no longer described the available processing path accurately.

## Decision

- Name Anthropic and OpenAI on the BastCare overview, privacy, processor, and architecture pages.
- Explain that BastCare selects a model for the task and sends each request only to the selected provider, not automatically to both.
- Keep the existing data boundary: only a masked transcript copy is sent for a user-requested summary, while Bast does not persist or log transcript text.
- Keep model version numbers out of evergreen copy and preserve the existing policy gate for material changes to providers, purposes, retention, or visit-data flows.
- Regenerate the public architecture PDF so the downloadable view matches the site.

## Evidence and publication gate

Beth requested this change on September 9, 2026 and confirmed that BastCare can use either OpenAI or Anthropic for processing. Before production publication, the processor inventory should use the legal entity names from Bast's applicable contracts and the policy version should receive final human review.
