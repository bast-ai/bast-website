# BastCare processing and encrypted-sharing disclosure

Beth approved these website updates on October 5, 2026:

- Use the agreed configured-name masking, temporary AI processing, local transcript/summary/provenance, translation, and no-sale explanation on the overview and privacy pages.
- Replace the blanket server-storage exclusion with the distinction between processing text and storing encrypted sharing copies whose device keys Bast does not hold.
- Describe MongoDB account records, technical records, and encrypted shared summaries.
- Remove DuploCloud from the current BastCare processor list.
- Keep native app wording unchanged; its recording and Settings disclosures remain consistent with this clarification and link to the web policy and processors.

The wording does not promise complete anonymization, future iCloud backup or key recovery, or additional AI-provider training/retention guarantees. Those are outside this change. Privacy and processor pages advance to version 1.3, effective October 5, 2026. The overview share-preview caption now specifically refers to sharing, so it does not imply that AI processing never sends text off the phone.

Evidence: current recording/translation masking paths, local VisitStore and source-evidence presentation, device-key relay encryption, and the October 5 read-only service/database review discussed with Beth. Historical test records are not represented as current production logging behavior.

Source preflight: isolated branch from `bast-ai/bast-website` `origin/main` at `91e3de6b246b145b42757a80de087bf3def7be8f`, clean before edits. The existing `codex/manifesto-sharing-image` checkout and its untracked artifacts belong to prior work and were left untouched.
