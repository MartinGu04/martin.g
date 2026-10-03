# MARTIN.G design system: Cinematic Hybrid+

The visual language every later phase inherits. Cinematic, bold, engineered, dimensional,
atmospheric; scrolling moves through scenes, not sections.

**One grammar, many worlds.** MARTIN.G provides the common grammar: scale, typography
hierarchy, spacing, grid logic, motion quality, transitions, brand marks and cinematic
pacing. Each major project may temporarily take over the whole experience as its own world,
radically changing color, light, texture, imagery and atmosphere, but never the grammar.
The page is `scene → scene → scene`, not `section → section → section`, and it never stays
dark graphite from top to bottom.

Live specimen: `/en/system` and `/he/system`; the scene and world demonstration:
`/en/system/scenes` and `/he/system/scenes`. Local and preview builds only (404 in
production, noindex, not in the sitemap, not linked).

Lineage: Direction C (Cinematic Hybrid) is the structural and cinematic foundation. From B
(Industrial) only restrained accents: grain, a partial technical grid, registration marks,
a technical dot field and material depth, never the identity of the global world (not
tactical, military, cyberpunk or dashboard). From A (Monumental) the ability to break the
visual world completely between scenes, such as a light project surface taking over.

## The MARTIN.G world

| Token              | Value                    | Use                                       |
| ------------------ | ------------------------ | ----------------------------------------- |
| `--surface-0`      | `#060606`                | the cinematic black                       |
| `--surface-1`      | `#121212`                | raised surfaces, media shells, base light |
| `--text`           | `#F5F3EE`                | primary text (18.3:1 on background)       |
| `--text-muted`     | `#B3B1AC`                | secondary text (9.5:1 / 8.7:1, decisive)  |
| `--line`           | `rgb(255 255 255 / .10)` | structural lines, dividers, grid          |
| `--line-strong`    | `rgb(255 255 255 / .20)` | major divisions, marks, hover and focus   |
| `--control-border` | `#6B6B6B`                | form borders and UI boundaries (3:1)      |
| `--error`          | `#FFA38F`                | form errors on dark registers (4.5:1)     |
| `--light`          | `#FFF4E6`                | the warm key light of atmosphere layers   |
| `--shade`          | `#000000`                | what light falls off into (vignette)      |
| `--accent(-2)`     | = `--text`               | brand default: no accent color            |

Components read semantic tokens only; `--mg-*` palette constants just feed them. Muted text
is deliberately bright: hierarchy comes from scale and weight, not from grey on black.
Gradients exist only as light (one warm or neutral source falling off into shade). Never
purple or blue AI gradients, blobs, neon, glow effects or glassmorphism. Radius is 0 (2px
only on focus rings).

## Typography

**Archivo** (Latin) + **Noto Sans Hebrew** (Hebrew). Both SIL OFL 1.1, variable,
self-hosted from `src/fonts` via `next/font/local` (licenses included). Archivo is instanced
to width 100 to 125% and weight 300 to 900.

The contrast is the point: the **wordmark is refined and elegant**; every display role is
**heavy, expanded and extremely confident**.

- Archivo is an engineered grotesk with a real width axis. Display roles set it expanded
  (104 to 125%) and heavy (600 to 800), which gives the launch-film scale; text roles use
  its normal width at 400 to 500. Chosen over Instrument Sans, Inter Tight, Red Hat
  Display, Host Grotesk and the previous Hanken Grotesk in side-by-side comparisons.
- Hebrew carries equal authority: display roles step up to Noto Sans Hebrew 900 (800 for
  heading 1, 700 below). Compared at display scale against Rubik 800 (geometric but softer
  and friendlier, with rounded corners) and Secular One (distinctive but lighter, one
  weight): neither gives clearly more confidence beside expanded Archivo, so the family
  stays. Body and interface Hebrew is Noto Sans Hebrew 400 to 600.
- Each family is limited to its script with `unicode-range`. Mixed runs resolve per
  character; digits and punctuation always come from Archivo, so numerals match across
  locales. Next's auto-generated fallback faces are disabled (they have no `unicode-range`).
- Hebrew uses no negative tracking, taller leading, no uppercase (labels switch to weight
  and size) and slightly larger labels. Never use `ch` units for measures: `ch` comes from
  the "0" glyph, which the Hebrew face does not contain.

| Role (class)   | Size (320 to 1600px) | Weight EN / HE | Width | Use                         |
| -------------- | -------------------- | -------------- | ----- | --------------------------- |
| `t-hero`       | per tier, near-edge  | 800 / 900      | 125%* | the monumental statement    |
| `t-display-xl` | 48 to 184px          | 800 / 900      | 122%  | scene titles, project names |
| `t-display`    | 40 to 120px          | 800 / 900      | 120%  | large titles in a scene     |
| `t-heading-1`  | 32 to 76px           | 700 / 800      | 112%  | section and page titles     |
| `t-heading-2`  | 24 to 52px           | 650 / 700      | 108%  | statements, sub-sections    |
| `t-heading-3`  | 20 to 30px           | 600 / 700      | 104%  | item titles                 |
| `t-statement`  | 22 to 30px           | 550 / 600      | 100%  | a scene's main statement    |
| `t-lead`       | 18 to 24px           | 500            | 100%  | intros                      |
| `t-body-l`     | 17 to 21px           | 400            | 100%  | important body text         |
| `t-action`     | 16 to 18px           | 600            | 100%  | calls to action, CTAs       |
| `t-body`       | 16 to 17px           | 400            | 100%  | running text                |
| `t-small`      | 13 to 14px           | 400            | 100%  | captions, metadata          |
| `t-label`      | 12px / HE 14px       | 600            | 112%  | eyebrows, nav, "01 / WORK"  |
| `t-micro`      | 12px / HE 13px       | 600            | 112%  | annotations                 |
| `t-numeric`    | inherits             |                |       | tabular lining figures      |

`t-hero` is sized per tier so the longest line runs nearly to the frame edge (it may enter
the inline-end page margin). \*On desktop it sets at 120% width and -0.05em tracking, which
buys about 6% more size in the same line length; there the size tracks the page margin, so
the longest line keeps a deliberate gap of about 1.7% of the viewport (21 to 27px between
1200 and 1600px) and never wraps differently on wide screens. Mobile sets the statement over
four lines (English) or two (Hebrew) at near-viewport size. Body, small, label and micro
sizes are rem-dominant so they scale fully with browser zoom; only display sizes lean on the
viewport.

Readability targets on a desktop (since 4.6), applied on phones at their own scale: project
titles about 72 to 90px (a scene overrides `--display-size` for this), statements 24 to
30px (`t-statement`), important body 18 to 21px (`t-body-l`), calls to action 16 to 18px
(`t-action`), micro text 12 to 14px. Anything a visitor must read to understand the work
uses one of the first four; `t-label` and `t-micro` are for orientation only.

## Grid and spacing

| Tier    | Viewport   | Columns | Gutter | Page margin                            |
| ------- | ---------- | ------- | ------ | -------------------------------------- |
| Mobile  | < 768px    | 4       | 16px   | 20px                                   |
| Tablet  | 768 → 1199 | 8       | 20px   | 32 → 48px                              |
| Desktop | ≥ 1200px   | 12      | 24px   | 48 → 96px                              |
| Wide    | ≥ 1600px   | 12      | 32px   | content capped at 1600px, margins grow |

- `<Grid>` is the page container and grid. `<Cell span start>` handles one-off placements;
  spans inherit upward (tablet falls back to mobile, desktop to tablet).
- Named placements recompose per tier (they are not scaled copies):

  |                | mobile | tablet     | desktop              |
  | -------------- | ------ | ---------- | -------------------- |
  | `.col-full`    | 1 / -1 | 1 / -1     | 1 / -1               |
  | `.col-content` | 1 / -1 | 1 / -1     | 2 / span 10          |
  | `.col-inset`   | 1 / -1 | 2 / span 6 | 3 / span 8           |
  | `.col-aside`   | 1 / -1 | 1 / span 2 | 1 / span 3           |
  | `.col-main`    | 1 / -1 | 3 / span 6 | 5 / span 8           |
  | `.col-text`    | 1 / -1 | 3 / span 6 | 5 / span 6 + measure |

- Full-bleed media never sits inside a grid; it is a sibling of the grid.
- Grid lines follow the inline direction, so every layout mirrors in RTL without extra code.
- Rhythm: 4px base (`--space-1` … `--space-10`); `--section-space` 80 → 192px between
  sections; `--section-space-sm` 48 → 112px inside them; `--heading-gap` between a section
  heading and its content; `.stack-*` for vertical rhythm between siblings.
- Measures: text 38rem (about 70 characters), lead 34rem, narrow 24rem, headings 11em
  (13em in Hebrew).

## Scenes

`<Scene>` is the unit of the page: a themed, isolated frame with its own atmosphere.

- `size="frame"` fills the viewport below the header, like a film frame; `"flow"` fits its
  content. Padding and alignment are tunable through `--scene-pad-start`,
  `--scene-pad-end` and `--scene-align`.
- `theme` (a world) and `atmosphere` (layers; defaults to the theme's, then the brand's).
- `enter` is how a scene takes over from the one before it, driven by native scroll. Four
  transitions, each with one meaning (docs/HOMEPAGE.md):
  - `wipe`: a project world takes over, opening from a framed panel to full bleed.
  - `split`: a technical world takes over, opening from a center seam while its grid draws.
  - `dissolve`: the MARTIN.G world returns, fading in over the previous world's tail.
  - `cut`: no transition (restraint, and calm changes of subject).
- `exit` lets a world hand the frame back the way it took it: `wipe` closes back to a framed
  panel, `split` contracts to the seam. Exits fill forwards only, so they never override
  the entry.
- An entering scene slides `--scene-overlap` over the tail of the previous one, so the
  previous world stays visible around it while it opens. Every scene's end padding is at
  least the overlap, so it only ever covers empty space.
- `ambient` marks a scene whose continuous loops run only while it is on screen (motion.css,
  docs/HOMEPAGE.md, "Ambient loops").
- Stages (a tall scene with a sticky frame on a named view timeline) are compositions, not a
  primitive; the homepage no longer uses one (How I Work advances on its own since 4.5).
- Atmosphere layers carry `data-layer` (`base`, `light`, `haze`, `grid`, `texture`,
  `vignette`, `marks`) so a composition can move or fade one layer on its own timeline.
- `<Thread from to>` (since 4.6) is the visual handoff between scenes: a 2px hairline at a
  scene's top, a gradient from the previous world's thread color to this one's
  (`thread` in `src/content/worlds.ts`), with a small head in the arriving color. It draws
  in from the inline start as its scene arrives (scroll-driven, static without motion,
  hidden in forced colors) and is decorative. One per scene; the closing scene resolves it
  (drawn once, an open square, still).
- Brand marks inside scenes (4.7, brand polish): the wordmark belongs to the header and the
  footer only. The hero carries the identity in type (Martin Gusin, Product Builder) and
  the symbol as one hairline outline (`HeroSymbol`, below). Interior scenes use grid
  geometry, lines and nodes instead, or nothing.
- Glyphs (4.7): small custom inline SVG on the 24-unit grid (hairline strokes, square
  nodes, orthogonal paths, no gradients, no containers), monochrome or a world's second
  accent, about 18 to 24px. Never an icon pack.

`<DepthType>` adds foreground/background depth: oversized, cropped typography behind the
content (`line` along the lower edge, panning on scroll; `index`, a huge numeral receding
on scroll). Always a decorative duplicate of readable text, hidden from assistive
technology.

## Atmosphere

`<Atmosphere>` (inside every scene) layers, back to front:

| Layer    | Options                              | Notes                                    |
| -------- | ------------------------------------ | ---------------------------------------- |
| base     | always                               | `--surface-1` falling into `--surface-0` |
| light    | `shaft`, `pool`, `side`, `none`      | one source; mirrors in RTL               |
| haze     | with any light                       | slow drift (48s), motion-safe            |
| grid     | `hidden`, `light`, `fade`, `visible` | drawn from the real grid tokens          |
| texture  | `grain`, `paper`, `dots`, `none`     | SVG noise data URIs; dots are technical  |
| vignette | on / off                             | falls off into `--shade`                 |
| marks    | on / off                             | corner registration marks on the margins |

The grid is always authoritative; the atmosphere only decides how much of it is drawn:
hidden, only where the light falls, fading, or fully drawn (a technical world). Brand
default: shaft light, hidden grid, fine grain, vignette. The hero adds the grid inside the
light and registration marks; that is the upper limit of technical detail in the MARTIN.G
world. Every layer reads the scope's semantic colors, so one spec renders correctly in any
world; light strength, vignette and grain amount follow the scheme (grain is the world's ink seen through a noise mask, with no blend mode, so it stays cheap to composite). The whole
atmosphere is removed in forced-colors mode.

## Worlds

A world is a `ProjectTheme` (`src/content/schema.ts`), applied by `<Scene>` or
`<ThemeScope>`:

- required: background (`surface0`), raised surface (`surface1`), foreground (`text`),
  muted text (`textMuted`)
- optional: structural `line`, `accent`, `accent2`, the color of `light` and `shade`, and
  the `atmosphere` layers

Focus ring, selection, strong lines and control borders are derived inside the scope, so a
world cannot break them. There are no spacing, grid, type or motion keys (tested). Colors
are `#rrggbb` so `themeIssues()` validates every world in tests: text and muted text at
4.5:1 on both surfaces, accents at 3:1, scheme matching the background. Worlds are
server-rendered: the first paint already shows the right world.

| World    | Character                                                    | Status     |
| -------- | ------------------------------------------------------------ | ---------- |
| MARTIN.G | cinematic dark, warm key light, grain, depth type            | production |
| ON       | cream, bordeaux, olive, warm black; photography; paper; soft | production |
| המחלבה   | darker, cooler, structured; drawn grid, dots, marks, real UI | production |
| Defense  | gunmetal archive, one cold accent; generated system diagrams | production |

ON uses its real brand values (sampled from the live site), in three registers: cream
(`on`), wine (`onBordeaux`) and the near-black screening room of its case study's film
(`onNight`); the המחלבה world keeps its technical register, with one more register for its
case study's manager chapter (`miMaMoCard`, the interface's deep card blue). Industrial
detail (visible grid, dots, marks, data fragments, technical motion) belongs to the
mi-ma-mo world, not to the MARTIN.G identity. Internal Systems (the confidential work) never
uses classified, warning, clearance or dossier language or styling.

## Primitives (deliberately few)

`Grid`/`Cell`, `GridLines` (the visible grid, drawn from the real grid tokens), `Rule`,
`SectionHeading`, `Eyebrow`, `IndexNumber`, `TextBlock`, `Name` (bidi-isolated proper
names), `MediaShell` (aspect-ratio frame, per tier when art directed; `contain` for
cut-outs; `MediaFrame` renders all media into it, with `<picture>` art direction and
`PreviewVideo` for watermarked preview films), `ViewCycle` (real views taking turns in one
frame), `SystemDiagram` (generated, abstract system geometry for confidential work),
`LiveSiteLink` (the quiet external action), `Arrow` (mirrors in RTL), `ProjectIndex`,
`ThemeScope`, `Scene`, `Atmosphere`, `DepthType`, `Reveal`, surface utilities (`.surface`,
`.surface-outline`). No card library, no UI kit.

## Brand marks

- **Wordmark** (MARTIN.G) is primary: tablet/desktop header, footer.
  **Symbol** (the MG monogram; `Monogram` in code) is secondary: compact mobile header,
  favicon and app icons, and the hero's outline device.
- **One strong brand moment over repeated weaker ones.** Per page the wordmark appears once
  in the header (or the symbol on phones) and once in the footer. The hero names Martin in
  type and carries the symbol only as a single 1px outline at 30% bone, cropped past the
  inline end, drawn in once (static without motion, desktop only, absent in forced
  colors). It is decorative (`aria-hidden`); the hero's `<h1>` keeps the accessible name
  "MARTIN.G: principle".
- **Approved artwork** (Phase 6), supplied by Martin, as SVG: `public/brand/`
  `martin-g-symbol.svg` (752 × 622), `martin-g-wordmark.svg` (1090 × 103) and
  `martin-g-lockup.svg` (1090 × 675, symbol over wordmark; an asset for others' use, not
  rendered on the site). Each is a faithful vectorization of the supplied file (potrace, one
  `currentColor` path, even-odd fill, no metadata): nothing redrawn or re-proportioned.
  Fidelity is checked by overlay against the source at its native size: intersection over
  union 0.9988 (symbol), 0.9942 (wordmark), 0.9962 (lockup), and no pixel differs by more
  than half its coverage. The supplied wordmark is only about 103px tall, so its SVG is as
  exact as that source allows; a larger master would let it be traced again. The marks are
  one color, tinted with `currentColor` (the scene's text color), so they read on dark and
  light worlds. The supplied originals stay outside the repository.
- **Legibility.** Both marks are built from solid strokes; the thinnest typical features
  are the wordmark's strokes (about 17% of its height) and the slits inside the symbol
  (about 4%). Minimum sizes keep them at 0.75 device pixels or more.
- **Minimum rendered height** (enforced in CSS: a smaller request renders at the minimum):

  | Device pixel ratio | Wordmark | Symbol |
  | ------------------ | -------- | ------ |
  | 1x                 | 14px     | 20px   |
  | 1.5x               | 12px     | 16px   |
  | 2x                 | 12px     | 14px   |
  | 3x                 | 12px     | 12px   |

- **Clear space**: wordmark 0.5 × its height on every side; symbol 0.25 × its height.
  `withClearSpace` reserves it; the header layout is tested against it.
- Sizes: header wordmark 18px desktop (about 190px wide), 16px tablet; mobile header symbol
  24px; footer wordmark 20px (about 210px, so it fits a 320px screen).
- **Icons** (`pnpm brand:icons`, `scripts/brand-icons.mjs`, from the symbol SVG): a black
  tile with one warm key light falling from the top inline-start corner, the symbol in bone,
  optically centered. Rounded tiles carry a hairline warm edge so they stay defined on dark
  browser chrome; on light chrome the dark tile is the contrast. `src/app/icon.svg`
  (scalable favicon), `favicon.ico` (16/32/48, symbol at 72% so it holds at 16px),
  `icon.png` 512, `apple-icon.png` 180 (full bleed; iOS rounds it), and for the web app
  manifest (`src/app/manifest.ts`) `public/icons/icon-192.png`, `icon-512.png` and
  `maskable-512.png` (full bleed, symbol inside the 80% safe zone).
- **Social cards** (`pnpm brand:og`, `scripts/og-cards.mjs`; Phase 7A.3, approved by
  Martin; a new render is `'pending'` and kept out of production until Martin approves it):
  1200 by 630, one per locale, the homepage hero in miniature. Cinematic
  black, one warm key light falling from above the inline-start third into shade, the grid
  drawn only inside the light, registration marks in the outer margin, the approved lockup
  in bone at 176px tall at the inline-start top (never mirrored: in Hebrew it moves to the
  right, unchanged), the principle set as the hero sets it (Archivo 800 at 125% width,
  -0.045em, two lines; Noto Sans Hebrew 900, one line), and `martin-g.dev` as a muted label
  after a hairline at the foot. Content keeps 88px inline and 72px block margins, so 2:1
  crops lose nothing. No grain (noise would multiply the file size); no other mark.
- Never distort, recolor with gradients, outline, add effects, or use the marks as
  decoration or loaders.

## Header and footer

- Header: sticky, solid background, hairline bottom rule, aligned to the page grid. It takes
  on the semantic colors of the scene beneath its lower edge (`HeaderWorld`), crossfading
  between worlds; without JavaScript it keeps the MARTIN.G colors.
  Wordmark (tablet/desktop) or symbol (mobile), then navigation: `Work`, `About` (the
  homepage's About scene, from any page), `Contact` and the language switch `EN / HE` (no
  dead links; tests check that every header and footer link resolves). No menu drawer, one
  sticky row at every width: from 390px the symbol and the full navigation; from 360 to
  389px the Latin labels' tracking tightens (0.16em to 0.06em) and the gaps narrow; below
  360px (small phones, 400% zoom) the language switch shows only the other language's code
  (the one a visitor can act on; the current one is already the page's language) and drops
  the divider. Labels never wrap, keep 44px targets and clear the symbol (tested in both
  languages at 390, 360, 320 and 320 at 400% zoom).
- Language switch: codes stay Latin and in `EN / HE` order in both directions; the current
  language has `aria-current`; accessible names start with the visible code ("HE עברית").
- Footer: rule, wordmark, positioning and principle, copyright, and one labelled navigation:
  Work, About, Contact, Privacy, Accessibility and the language switch. No social links, address,
  phone or registration details (none exist).

## Forms (Phase 6)

The project inquiry (`src/components/contact`) defines the form grammar; there is no form
library. Visible labels above every control, hints under the label, placeholders only as a
muted example of the answer (never instead of the label or the hint),
`(optional)` marked rather than every required field (the form says so once). Controls sit
on `--surface-1` with a `--control-border` boundary (3:1), radius 0, 48px tall, text at
body size (so phones never zoom into a field); focus is the system ring. Choices are real
radio buttons in a fieldset, each a whole bordered label at least 44px tall, the chosen
one outlined in the accent. Errors are text first (`--error`, a soft coral tested at
4.5:1 on the dark registers, with a square mark and a 4px inline-start boundary on the
control), listed in a summary that takes focus and links to each field. The action is a
solid block in the world's accent with the arrow, the one solid control on a page. On phones the
form keeps a tighter rhythm (2rem between fields instead of 3rem, a five-line problem
description field that still grows by hand), so the single column stays a short inquiry, not a
questionnaire.

## Motion

- **Ambient loops** (since 4.5): continuous motion while a scene is visible and the visitor
  does nothing: slow drifts, crossfades between real views, a process that advances, a scan,
  a typographic rail. Only inside `<Scene ambient>`, on elements marked `data-loop`, paused
  offscreen, never without scripting or with reduced motion; a loop that hides anything also
  needs `:root[data-motion]` pending or on. Periods of seconds to minutes, never fast cuts;
  never bouncing, floating cards, particles or cursor effects. `ViewCycle` is the shared
  crossfade for real views; `MediaFrame motion="drift"` the shared photograph drift.
- Vocabulary: large mask reveals, typography entrances, scene-scale transitions (`wipe`,
  `split`), layered depth (depth type panning and receding), atmospheric movement (haze
  drift), restrained technical motion inside technical worlds (grid drawing, data filling),
  subtle translate and opacity, restrained scale. No bounce, no scroll hijacking, no
  smooth-scroll libraries, no GSAP, Lenis or Motion, no fake loaders.
- Durations: micro 200ms (state changes), standard 600ms (reveals), cinematic 1100ms
  (masks), atmosphere 48s (drift). Easing `--ease-out`, masks `--ease-mask`, scenes
  `--ease-scene`. Scene transitions and depth are scroll-driven (`animation-timeline:
view()`); unsupported browsers see the final state.
- CSS first. The only JavaScript is `MotionController`: one IntersectionObserver that marks
  `[data-reveal]` elements as revealed.
- Safety: nothing may start hidden or clipped unless scripting is enabled and the user has
  not asked for reduced motion (`@media (scripting: enabled) and (prefers-reduced-motion:
no-preference)` for scroll-driven transitions; `html[data-motion]` for reveals, falling
  back to visible if the controller has not mounted within 2.5s). Depth and drift only move,
  never hide. Never wrap the h1 or the LCP element (the hero statement) in a reveal.
- Parallax: `data-parallax` and depth type are multiplied by the tier intensity
  `--parallax` (0 on mobile, 0.5 tablet, 1 desktop).
- Reduced motion collapses all durations, removes distances, scale, parallax, drift and
  transitions, and shows every scene in its final state.
- The hero is one frame with three short timed beats (identity, positioning, principle),
  masks that fill backwards only; nothing in it waits for scrolling.
- Hover effects exist only under `(hover: hover) and (pointer: fine)`; keyboard focus gets
  the same state plus the focus ring.

## Accessibility baseline

Skip link, labelled landmarks, one h1, semantic heading order, visible focus everywhere
(themes included), AA contrast by test, reduced motion, forced colors (marks stay visible,
decorative grid lines are removed), 44px touch targets in navigation, logical properties
only, RTL-safe layouts, no hover-only interaction, reflow without horizontal scrolling at
320 CSS px (400% zoom) and at 200% zoom, verified by e2e tests with axe.
