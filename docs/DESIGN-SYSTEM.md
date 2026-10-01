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
| `t-lead`       | 18 to 24px           | 500            | 100%  | intros, project summaries   |
| `t-body`       | 16 to 17px           | 400            | 100%  | running text                |
| `t-small`      | 13 to 14px           | 400            | 100%  | captions, metadata          |
| `t-label`      | 12px / HE 14px       | 600            | 112%  | eyebrows, nav, "01 / WORK"  |
| `t-micro`      | 11px / HE 13px       | 600            | 112%  | annotations                 |
| `t-numeric`    | inherits             |                |       | tabular lining figures      |

`t-hero` is sized per tier so the longest line runs nearly to the frame edge (it may enter
the inline-end page margin). \*On desktop it sets at 120% width and -0.05em tracking, which
buys about 6% more size in the same line length; there the size tracks the page margin, so
the longest line keeps a deliberate gap of about 1.7% of the viewport (21 to 27px between
1200 and 1600px) and never wraps differently on wide screens. Mobile sets the statement over
four lines (English) or two (Hebrew) at near-viewport size. Body, small, label and micro
sizes are rem-dominant so they scale fully with browser zoom; only display sizes lean on the
viewport.

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
- Stages (a tall scene with a sticky frame on a named view timeline) are compositions, not a
  primitive: How I work uses one, only under scripting, motion allowed,
  `height >= 34rem` and scroll-timeline support; otherwise the same markup is static.
- Atmosphere layers carry `data-layer` (`base`, `light`, `haze`, `grid`, `texture`,
  `vignette`, `marks`) so a composition can move or fade one layer on its own timeline.

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

| World        | Character                                                    | Status     |
| ------------ | ------------------------------------------------------------ | ---------- |
| MARTIN.G     | cinematic dark, warm key light, grain, depth type            | production |
| ON           | cream, bordeaux, olive, warm black; photography; paper; soft | homepage   |
| המחלבה       | darker, cooler, structured; drawn grid, dots, marks, real UI | homepage   |
| Confidential | deeper graphite restricted archive; no light, no texture     | production |

ON uses its real brand values (sampled from the live site); the המחלבה world keeps its
technical register; they are not attached to content yet. Industrial
detail (visible grid, dots, marks, data fragments, technical motion) belongs to the
mi-ma-mo world, not to the MARTIN.G identity. Confidential work never uses classified or
military visual language.

## Primitives (deliberately few)

`Grid`/`Cell`, `GridLines` (the visible grid, drawn from the real grid tokens), `Rule`,
`SectionHeading`, `Eyebrow`, `IndexNumber`, `TextBlock`, `Name` (bidi-isolated proper
names), `MediaShell` (aspect-ratio frame, per tier when art directed; `contain` for
cut-outs; `MediaFrame` renders all media into it, with `<picture>` art direction and
`PreviewVideo` for watermarked preview films), `LiveSiteLink` (the quiet external action), `Arrow` (mirrors in RTL), `ProjectIndex`,
`ThemeScope`, `Scene`, `Atmosphere`, `DepthType`, `Reveal`, surface utilities (`.surface`,
`.surface-outline`). No card library, no UI kit.

## Brand marks

- **Wordmark** is primary: tablet/desktop header, hero, footer, social.
  **Monogram** is secondary: compact mobile header, favicon, small details.
- Assets are **provisional** alpha masks derived from the reference PNGs, tinted with
  `currentColor`, proportions untouched. They are not production artwork.
- **Legibility is a property of the design, not only of the raster.** Measured hairlines are
  about 2% of mark height (wordmark ~4.5px at 228px; monogram ~11px at 599px). At header
  sizes that is sub-pixel whatever the format: below the minimum the wordmark's M loses its
  thin stroke and reads as an N. A vector would not fix this; a small-size optical cut of the
  marks would, and that is a brand decision, not something to fake in code.
- **Minimum rendered height** (enforced in CSS: a smaller request renders at the minimum;
  keeps a typical hairline at ~0.55 device px or more):

  | Device pixel ratio | Wordmark | Monogram |
  | ------------------ | -------- | -------- |
  | 1x                 | 32px     | 30px     |
  | 1.5x               | 21px     | 22px     |
  | 2x                 | 18px     | 16px     |
  | 3x                 | 14px     | 12px     |

- **Clear space**: wordmark 0.5 × its height on every side; monogram 0.25 × its height.
  `withClearSpace` reserves it; the header layout is tested against it.
- Header: design size 24px desktop, 20px tablet (1x screens render 32px). Mobile header uses
  the monogram (24px design size). Real-size tested at 1x, 2x and 3x.
- Never distort, recolor with gradients, outline, add effects, or use the marks as
  decoration or loaders.

## Header and footer

- Header: sticky, solid background, hairline bottom rule, aligned to the page grid. It takes
  on the semantic colors of the scene beneath its lower edge (`HeaderWorld`), crossfading
  between worlds; without JavaScript it keeps the MARTIN.G colors.
  Wordmark (tablet/desktop) or monogram (mobile), then navigation: `Work` and the language
  switch `EN / HE`. About and Contact appear only when their destinations exist (no dead
  links; tests check that every header and footer link resolves). No menu drawer: the
  compact navigation fits at 320px.
- Language switch: codes stay Latin and in `EN / HE` order in both directions; the current
  language has `aria-current`; accessible names start with the visible code ("HE עברית").
- Footer: rule, wordmark, positioning and principle, copyright, the same real destinations.
  No social or contact links until they exist.

## Motion

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
