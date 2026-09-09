# Advisory refresh and on-device transcript retention

Date: 2026-09-08

## Decision

- Keep the advisory library private from the public product navigation and
  search index, but give its screen presentation the same quiet editorial
  voice, tonal fades, and elevated panels as the current Bast and
  bethrudden.ai sites.
- Reduce the advisory primary navigation to Advisory and Contact. Contact
  leads to a new direct-conversation section on the advisory landing page.
- Replace the former automatic transcript-deletion promise across BastCare
  public pages. After a summary is saved successfully, visit audio is deleted;
  the original transcript remains protected on the iPhone with the visit.
- Explain the user controls that shipped with the updated flow: view or
  download the transcript, regenerate a summary from it, review the result as
  a preview, choose whether to replace the current summary, and share again
  when a CareTeam should receive the regenerated summary.
- Preserve the server boundary. A separate masked copy is sent temporarily for
  requested summary processing, and Bast does not persist or log transcript
  text. Deleting a visit removes its transcript and summary. Copies exported
  outside BastCare cannot be recalled.

## Evidence and limits

The product behavior comes from the BastCare 1.0.9 build-66 release handoff and
the approved on-device transcript decision in the BastCare repository. This
website change does not claim language, audience, reading-level, ontology, or
transcript-translation features; those remain separate product work.

The screen refresh is scoped with `body.advisory-site` and screen-only CSS so
the established advisory PDF print layout remains unchanged. The public
BastCare architecture PDF is regenerated from its checked-in builder to keep
the downloadable artifact aligned with the web policy.
