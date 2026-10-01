# MARTIN.G brand film

A short cinematic brand film for MARTIN.G, in two native cuts: **Desktop** (16:9,
3840×2160 master from a 1920×1080 design space) and **Mobile** (9:16, 1080×1920). Built
with [Remotion](https://www.remotion.dev); the soundtrack is synthesized from the same cue
table as the picture.

The film sells the studio, not the projects: a problem becomes a product.

| #   | Scene       | Desktop     | What happens                                                                  |
| --- | ----------- | ----------- | ----------------------------------------------------------------------------- |
| 01  | `Signal`    | 0.0 – 3.75  | a pulse, a rush through the grid, construction lines find the symbol, impact  |
| 02  | `Clarity`   | 3.75 – 10.0 | through the G: fragments snap into the real interface; PROBLEM → PRODUCT      |
| 03  | `Product`   | 10.0 – 16.5 | המחלבה in macro; one drag propagates through schedule, card and phone         |
| 04  | `Wall`      | 16.5 – 20.0 | the product is one tile of a wall of all the work; BUILT FOR REAL WORK.       |
| 05  | `Defense`   | 20.0 – 24.0 | Defense Systems as generated geometry only: state change, raw row → document  |
| 06  | `Design`    | 23.5 – 30.0 | the grid's cells become ON; macro on the headline; responsive; the story page |
| 07  | `Build`     | 29.75 – 33  | UNDERSTAND. DEFINE. DESIGN. BUILD. on the beats; the page goes live           |
| 08  | `Converge`  | 32.75 – 37  | a flight through the work; everything aligns into the symbol                  |
| 09  | `Signature` | 36.5 – 42   | silence, the symbol, the wordmark, MAKE IT REAL., one last note, black        |

The mobile cut tells the same story about six seconds tighter (36 s), starts mid-motion,
and is re-directed shot by shot for the tall frame (stacked type, one card at a time,
phone-sized details, text kept clear of the platform interface: nothing critical in the
top 15% or bottom 20%).

## Commands

```sh
cd film
pnpm install --ignore-workspace
pnpm assets                      # copy approved sources from the site into film/public
pnpm studio                      # Remotion Studio (scrub, tweak, preview)
node scripts/render.mjs desktop  # 3840×2160 master, with sound
node scripts/render.mjs mobile   # 1080×1920 master, with sound
FILM_SCALE=1 node scripts/render.mjs desktop   # quick 1920×1080 review render
node scripts/stills.mjs Desktop 3s 18s 36.75s  # review stills
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
src/components/          marks, type and masks, rebuilt המחלבה UI, geometry, tiles, slates
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
true-peak ceiling (4× oversampled limiter); silences before the two symbol reveals are
carved out of every stem. The opening impact and the finale share one signature; the last
note is its deeper, cleaner version.

## Rules this film follows

- **Brand marks** are the supplied symbol and wordmark (`public/brand/provisional` in the
  site), shown as supplied: never redrawn, recolored, outlined or distorted. Reveals use
  masks around the mark; the finale's mosaic only borrows its silhouette before the real
  mark replaces it.
- **Real work only.** המחלבה and ON appear through their approved screenshots and photographs
  (`src/assets/work`). For macro shots and the live interaction, parts of the המחלבה interface
  are rebuilt from those screenshots with the same labels and colors and the same anonymous
  placeholders; no real names or data. The ON preview film is not used (video only ever as
  the watermarked preview, played on the site).
- **Confidential work** appears only as the public alias "Defense Systems" and generated,
  non-representational geometry: no names, interfaces, labels, data, or classified,
  warning, clearance or dossier language or styling.
- No em dashes in on-screen copy; the end line is the locked campaign line, with no call to
  action, URL or handles.
