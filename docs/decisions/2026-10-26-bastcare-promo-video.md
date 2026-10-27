# BastCare promo video on /bastcare/ and the home page

Date: 2026-10-26
Owner: Beth
Status: Proposed (final sign-off is this PR)

## Context

Beth asked for a more striking BastCare presence. The /bastcare/ hero showed the
80-second silent captioned walkthrough (43 MB, click to play). A new 18-second
promo exists in portrait (1080x1920) and square (1080x1080). A voiceover cut
(v3) is coming and must be a file swap, not a code change.

## Decision

- **Media, version-free names** in `src/assets/bastcare/media/`:
  `bastcare-promo.mp4` (portrait), `bastcare-promo-square.mp4` (square), and
  `bastcare-promo-poster.jpg` (portrait frame at 1.9 s, "For family
  caregivers"). Re-encoded for the web, H.264 High, CRF 24, yuv420p,
  `+faststart`; the silent AAC track is kept so v3 audio drops in.
- **Layout.** One `<video autoplay muted loop playsinline controls>` in the
  /bastcare/ hero. The square file plays above 900px (larger hero column); the
  portrait file plays at 900px and below, where the hero narrows or stacks.
  Chosen with `<source media>`; browsers that ignore `media` get the square
  file, which also works on phones. The video background matches the promo's
  own white-to-blue gradient, so letterboxing of the poster is invisible.
  The `#bastcare-walkthrough` anchor id is kept so existing links still land
  on the hero video. Reduced-motion visitors get the video paused
  (`site.js`); controls stay available.
- **Home page hero.** The same promo autoplays in the home hero, with the same
  attributes, poster, and square/portrait sources, in a rounded media panel
  to the right of the headline. "The questions" list moves above the headline
  on desktop so it reads question, then "Here. It's called Bast.", with the
  video beside both. At 860px and below the hero stacks: headline, video, then
  the questions (the questions stay after the headline, as before). Under the
  video, "See BastCare in action" links to `/bastcare/`. The hero copy is
  unchanged.
- **Home BastCare card.** Now that the hero plays the video, the card keeps
  its original three screenshots (summary, CareTeam, sharing preview) instead
  of repeating the poster. Its "See how BastCare works" text link became a
  secondary button. No new copy or claims.
- **Old walkthrough** stays in the repo and the build. The /demos/ card that
  describes it ("Captioned walkthrough, 1 min 20 sec") now links straight to
  the walkthrough file instead of the /bastcare/ hero, so that card stays
  accurate.

## Swapping in v3

Encode the new cut the same way and overwrite the files:

```bash
ffmpeg -i promo-portrait.mp4 -c:v libx264 -preset slow -crf 24 -pix_fmt yuv420p \
  -profile:v high -level 4.1 -c:a aac -b:a 96k -movflags +faststart \
  src/assets/bastcare/media/bastcare-promo.mp4
# same for the square cut -> bastcare-promo-square.mp4
ffmpeg -ss 1.9 -i src/assets/bastcare/media/bastcare-promo.mp4 -frames:v 1 -q:v 3 \
  src/assets/bastcare/media/bastcare-promo-poster.jpg
```

If the duration changes from 18 s, nothing on the page states it.

## Guardrail

`scripts/check.mjs` requires both promo files and the poster in `dist/`.
For both the /bastcare/ hero and the home hero, it checks the square and
portrait sources plus autoplay, muted, loop, playsinline, controls, and the
poster. It also checks for exactly one video per page, the reduced-motion
pause hook, and the home hero link to `/bastcare/`. The walkthrough must stay
out of the /bastcare/ hero, and the check fails if either autoplaying file
exceeds 8 MB.

## Sign-off (Beth, 2026-10-26)

- The drug and doctor names in the video frames (Jascayd, trazodone,
  Dr. Chen) are test data.
- "Free to download" is the approved wording. The end card was re-rendered to
  say it, replacing "Free on iPhone", and both cuts were re-encoded.
- Replacing the home-page CareTeam screenshot was approved. It is back in the
  card now because the video moved to the hero.
