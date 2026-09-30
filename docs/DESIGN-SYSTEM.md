# MARTIN.G design system

The visual language every later phase inherits. Precise, architectural, editorial, quiet.
MARTIN.G itself uses almost no color: project themes bring the color, inside the same grid,
type and motion rules.

Live specimen: `/en/system` and `/he/system` in local and preview builds (404 in production,
noindex, not in the sitemap, not linked).

## Color

| Token                    | Value                    | Use                                     |
| ------------------------ | ------------------------ | --------------------------------------- |
| `--surface-0`            | `#0B0B0B`                | page background                         |
| `--surface-1`            | `#111111`                | raised surfaces, media shells           |
| `--text`                 | `#F1F0EC`                | primary text (17.3:1 on background)     |
| `--text-muted`           | `#949494`                | secondary text (6.5:1 / 6.2:1, WCAG AA) |
| `--line`                 | `rgb(255 255 255 / .07)` | structural lines, dividers, grid        |
| `--line-strong`          | `rgb(255 255 255 / .14)` | major divisions, hover and focus states |
| `--control-border`       | `#6B6B6B`                | form borders and UI boundaries (3:1)    |
| `--accent`, `--accent-2` | = `--text`               | brand default: no accent color          |

Components read semantic tokens only; `--mg-*` palette constants just feed them. No
gradients, glows, blur or shadows. Radius is 0 (2px only on focus rings).

## Typography

**Hanken Grotesk** (Latin) + **Noto Sans Hebrew** (Hebrew). Both SIL OFL 1.1, variable
100 to 900, self-hosted from `src/fonts` via `next/font/local` (licenses included).

Why this pairing:

- The MARTIN.G wordmark is the only expressive letterform: a high-contrast, calligraphic,
  Didone-like mark. Everything else must be quiet and must not compete. A second display
  serif would drift toward a luxury-fashion template; a neutral grotesk keeps it
  contemporary and architectural.
- Hanken Grotesk at light weights sits calmly beside the wordmark: slightly open proportions,
  precise terminals, no quirks, and less ubiquitous than Inter (Inter Tight read as generic
  UI next to the mark). Its figures are tabular by default, so project numerals align.
- Noto Sans Hebrew matches Hanken's stroke and color at the same weights and reads as more
  typographic than Heebo, which is the default of countless Israeli product sites and sat
  slightly rounder next to the grotesk. Assistant was visibly lighter and smaller than any
  Latin partner.
- Evaluated and rejected: Instrument Sans (no weights below 400, too heavy against the
  hairline wordmark), Inter Tight, Onest (startup-geometric), Schibsted Grotesk
  (newspaper-heavy), IBM Plex Sans / Plex Hebrew (corporate), Heebo, Assistant.

Mechanics:

- Each family is limited to its script with `unicode-range`. Mixed runs (brand names,
  numerals, English terms in Hebrew) resolve per character. Digits and punctuation always
  come from Hanken, so numerals match across locales.
- Next's auto-generated fallback faces are disabled: they have no `unicode-range` and would
  capture the other script's glyphs. Role stacks end in system fonts.
- Hebrew uses no negative tracking, taller leading, no uppercase (labels switch to weight and
  size), and slightly larger labels. Never use `ch` units for measures: `ch` comes from the
  "0" glyph, which the Hebrew face does not contain. Use `em` on the text element or `rem`.

| Role (class)   | Size (320 → 1600px) | Leading EN / HE | Weight | Use                         |
| -------------- | ------------------- | --------------- | ------ | --------------------------- |
| `t-display-xl` | 52 → 168px          | 0.96 / 1.06     | 300    | hero-scale statements       |
| `t-display`    | 44 → 112px          | 1.00 / 1.08     | 300    | project titles in the index |
| `t-heading-1`  | 36 → 72px           | 1.04 / 1.14     | 300    | section titles, page titles |
| `t-heading-2`  | 28 → 48px           | 1.10 / 1.20     | 300    | statements, sub-sections    |
| `t-heading-3`  | 22 → 32px           | 1.20 / 1.30     | 400    | item titles                 |
| `t-lead`       | 18 → 22px           | 1.45 / 1.60     | 300    | intros                      |
| `t-body`       | 16 → 17px           | 1.60 / 1.75     | 400    | running text                |
| `t-small`      | 13 → 14px           | 1.50 / 1.65     | 400    | captions, metadata          |
| `t-label`      | 12px / HE 14px      | 1.3             | 500    | eyebrows, nav, "01 / WORK"  |
| `t-micro`      | 11px / HE 13px      | 1.3             | 500    | annotations                 |
| `t-numeric`    | inherits            |                 |        | tabular lining figures      |

Body, small, label and micro sizes are rem-dominant so they scale fully with browser zoom.
Only display sizes lean on the viewport.

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

## Primitives (deliberately few)

`Grid`/`Cell`, `GridLines` (the visible grid, drawn from the real grid tokens), `Rule`,
`SectionHeading` (rule + eyebrow + optional title and intro), `Eyebrow`, `IndexNumber`,
`TextBlock`, `MediaShell` (aspect-ratio frame; `MediaFrame` renders all media into it),
`Arrow` (mirrors in RTL), `ProjectIndex`, `ThemeScope`, `Reveal`, surface utilities
(`.surface`, `.surface-outline`). No card library, no UI kit.

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

- Header: sticky, solid background, hairline bottom rule, aligned to the page grid.
  Wordmark (tablet/desktop) or monogram (mobile), then navigation: `Work` and the language
  switch `EN / HE`. About and Contact appear only when their destinations exist (no dead
  links; tests check that every header and footer link resolves). No menu drawer: the
  compact navigation fits at 320px.
- Language switch: codes stay Latin and in `EN / HE` order in both directions; the current
  language has `aria-current`; accessible names start with the visible code ("HE עברית").
- Footer: rule, wordmark, positioning and principle, copyright, the same real destinations.
  No social or contact links until they exist.

## Motion

- Vocabulary: mask reveal (`clip-path`, only for masks), subtle translate (0.5 or 1.5rem),
  opacity, restrained scale (0.98 to 1), subtle parallax. No bounce, no decorative loops,
  no scroll hijacking, no smooth-scroll libraries, no fake loaders.
- Durations: micro 200ms (state changes), standard 600ms (reveals), cinematic 1100ms (masks,
  large media). Easing `--ease-out`, masks `--ease-mask`. Stagger 80ms via `order`.
- CSS first. The only JavaScript is `MotionController`: one IntersectionObserver that marks
  `[data-reveal]` elements as revealed.
- Safety: content may start hidden only when an inline head script has confirmed JavaScript
  (`html[data-motion]`) and the user has not asked for reduced motion. If the controller has
  not mounted within 2.5s, the page falls back to fully visible. Without JavaScript nothing
  is ever hidden. Never wrap the h1 or LCP element in a reveal.
- Parallax: `data-parallax` with `--parallax-shift`, CSS scroll-driven (`animation-timeline:
view()`), multiplied by the tier intensity `--parallax` (0 on mobile, 0.5 tablet, 1
  desktop). Unsupported browsers simply see no parallax.
- Reduced motion collapses all durations, removes distances, scale and parallax, and
  reveals everything immediately.
- Hover effects exist only under `(hover: hover) and (pointer: fine)`; keyboard focus gets
  the same state plus the focus ring.

## Themes

`<ThemeScope theme>` lets a project section temporarily control:

- required: background (`surface0`), raised surface (`surface1`), foreground (`text`),
  muted text (`textMuted`)
- optional: structural `line` (otherwise derived from the foreground), `accent`, `accent2`

Focus ring, selection, strong lines and control borders are derived inside the scope, so a
theme cannot break them. The type allows no spacing, grid, type or motion keys. Colors are
`#rrggbb` so `themeIssues()` (`src/lib/theme.ts`) can validate every theme in tests: text
and muted text at 4.5:1 on both surfaces, accents at 3:1, scheme matching the background.
Themes are server-rendered, so there is never a flash of the wrong palette. Project themes
(ON, mi-ma-mo, confidential) are designed in later phases.

## Accessibility baseline

Skip link, labelled landmarks, one h1, semantic heading order, visible focus everywhere
(themes included), AA contrast by test, reduced motion, forced colors (marks stay visible,
decorative grid lines are removed), 44px touch targets in navigation, logical properties
only, RTL-safe layouts, no hover-only interaction, reflow without horizontal scrolling at
320 CSS px (400% zoom) and at 200% zoom, verified by e2e tests with axe.
