# MARTIN.G brand film

A short cinematic brand film for MARTIN.G, in two native cuts: **Desktop** (16:9,
3840×2160 master from a 1920×1080 design space) and **Mobile** (9:16, 1080×1920). Built
with [Remotion](https://www.remotion.dev); the soundtrack is synthesized from the same cue
table as the picture.

Second pass (Version 2). The film sells MARTIN.G itself; the projects are proof inside the
story, never the subject: IDEA → CAPABILITY → PROCESS → PROOF → OUTCOME → BRAND.

| #   | Scene          | Desktop     | What happens                                                                           |
| --- | -------------- | ----------- | -------------------------------------------------------------------------------------- |
| 01  | `Idea`         | 0 – 5       | a line of light, like a thought, traces the M of the new mark; הכול מתחיל מרעיון.      |
| 02  | `Idea`         | 5 – 10      | the line becomes grid, frame, wireframe, components, a real website                    |
| 03  | `Capabilities` | 10 – 17     | one frame becomes a website, a product, a brand, a system; BUILT AROUND REAL NEEDS.    |
| 04  | `Proof`        | 17 – 24     | one drag ripples through a real system; the wall of all the work; BUILT FOR REAL WORK. |
| 05  | `Outcome`      | 24 – 30     | manual clutter folds into one calm card; the card opens on real people                 |
| 06  | `Craft`        | 30 – 34     | UNDERSTAND. DEFINE. DESIGN. BUILD.: each word sweeps the object into its next stage    |
| 07  | `World`        | 34 – 39.75  | one flight through the work along the mark's diagonals; מהרעיון. עד הדבר האמיתי.       |
| 08  | `Signature`    | 39.5 – 44.5 | silence, the MG symbol, the MARTIN.G wordmark, MAKE IT REAL., one last note, black     |

The mobile cut (35 s) is its own edit: the line is already moving on the first frame, one
idea and one object at a time, larger focal objects, shorter proof, captions broken for the
phone, nothing critical in the top 15% or bottom 20% of the frame.

**Language.** Hebrew leads (the human line, Noto Sans Hebrew, word by word in reading
order); English supports (small, tracked) or stands alone as a campaign line. Every Hebrew
line is Martin's own wording from the second-pass brief, used verbatim (src/config/copy.ts).

**Brand.** The approved MG symbol, MARTIN.G wordmark and lockup live in `film/brand`,
exactly as supplied; only their black ink was turned white on transparent for the dark
film. Their geometry (verticals and a 34 degree diagonal, src/brand/geometry.ts) drives the
opening trace, the wipes, the corridor and the final mosaic.

## Commands

```sh
cd film
pnpm install --ignore-workspace
pnpm assets                      # copy approved sources from the site into film/public
pnpm studio                      # Remotion Studio (scrub, tweak, preview)
node scripts/render.mjs desktop  # 3840×2160 master, with sound
node scripts/render.mjs mobile   # 1080×1920 master, with sound
FILM_SCALE=1 node scripts/render.mjs desktop   # quick 1920×1080 review render
node scripts/stills.mjs Desktop 3s 18s 39.75s  # review stills
```

Audio needs Python 3 with `numpy` and `scipy`. Where Remotion cannot download its own
browser, point `FILM_BROWSER` at a Chromium headless shell. Renders and generated audio go
to `film/out` and `film/public/audio` (both ignored by Git).

## Structure

```
src/config/timeline.ts   the single clock: BPM, cue points per version, scene spans, sound score
src/config/copy.ts       every on-screen word (and the interface labels copied from screenshots)
src/config/palette.ts    colors, from the site's tokens and worlds
src/config/assets.ts     approved sources and their sizes
src/lib/camera.tsx       CSS 3D camera: Stage, Plane, depth of field, near-lens fade
src/lib/anim.ts          easing, keyframes, deterministic drift and random
src/brand/geometry.ts    the MG mark's own geometry, used as the film's visual language
src/components/          marks, captions, type and masks, rebuilt המחלבה UI, geometry, tiles
src/scenes/              one file per scene; each renders from the absolute frame and cues
audio/build.py           the score and sound design; stems and a mastered mix
scripts/                 asset sync, cue export, stills, render
```

Every frame is a pure function of the frame number (no state carried between frames), so
any timing change in `timeline.ts` moves the picture and the sound together. Change a cue,
then re-render; `audio/build.py` reads the exported cues.

### Sound

Five stems (`music`, `ambience`, `impacts`, `transitions`, `ui`) and `mix.wav`, 48 kHz /
24-bit. The master is loudness-normalized to about −14 LUFS integrated with a −1 dBFS
true-peak ceiling (4× oversampled limiter). No alarm-like sounds: the film opens on a low
bloom and a soft sub pulse, a moving tone follows the line of light, and the score grows
from there (curiosity, immersion, rhythm, confidence, climax). Transition sounds are few and
quiet; interface sounds are percussion. Before the symbol, every stem is carved to silence;
the brand chord heard far away in the opening returns there, and the last note is its
deeper, cleaner resolution.

## Rules this film follows

- **Brand marks** are the approved MG symbol and MARTIN.G wordmark (`film/brand`), shown as
  supplied: never redrawn, outlined or distorted. Reveals use masks around the mark; the
  finale's mosaic only borrows its silhouette before the real mark replaces it.
- **Real work only.** המחלבה and ON appear through their approved screenshots and photographs
  (`src/assets/work`). For macro shots and the live interaction, parts of the המחלבה interface
  are rebuilt from those screenshots with the same labels and colors and the same anonymous
  placeholders; no real names or data. The ON preview film is not used (video only ever as
  the watermarked preview, played on the site).
- **Confidential work** appears only as generated, non-representational geometry on the
  wall (unnamed): no names, interfaces, labels, data, or classified,
  warning, clearance or dossier language or styling.
- No em dashes in on-screen copy; the end line is the locked campaign line, with no call to
  action, URL or handles.
