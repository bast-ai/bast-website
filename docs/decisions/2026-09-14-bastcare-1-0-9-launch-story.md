# Advertise the live BastCare 1.0.9 release

## Decision

Lead the BastCare page with the live 1.0.9 benefit: people can read a saved visit summary in English, Korean, Simplified Chinese, Vietnamese, or Colombian Spanish. Pair that with the calmer visual system, saved translation reuse, transcript export, and interruption recovery.

Tell the operating story boldly: Bast is built through a human + machine partnership. A build or signed IPA is a working iteration, the current loop averages two to three per day, and work that traditionally took teams weeks can move in days. Humans retain direction, evidence review, and release judgment while agents accelerate the loop.

Use Build 76, 818 passing release-gate tests, and the privacy-safe aggregate count of successful summary runs as proof that the speed is paired with continual testing and real use.

## Evidence

- Apple's public U.S. lookup API reported version 1.0.9 as live on September 12, 2026 and supplied the published release notes and description.
- Bitbucket `bast-careloop` main records the exact Build 76 artifact, 818 passed tests, device checks, and Apple's September 13 availability confirmation in `docs/release/1-0-9-build-76-submission-record.md`.
- The owner supplied the current two-to-three working builds or IPAs per day observation. The release history independently shows multiple numbered candidates on active iteration days.
- The website's existing `bastcare-metrics.json` contains approved aggregate totals and no transcript text.
- The human + agent operating model follows `ai-workspace`: Thanh owns engineering, build, infrastructure, and releases; Beth owns product, privacy, public wording, and final GO/NO-GO.

## Meaning

Translation applies to the saved visit summary, not the recording or the app interface. The human + machine story is about the partnership: machines increase the number and speed of tested learning cycles; accountable people decide the product direction and what ships.
