# Homepage choreography (Phase 3)

The homepage is one continuous sequence of scenes, `scene → scene → scene`, held together by
the MARTIN.G grammar (docs/DESIGN-SYSTEM.md). Scrolling is always native: every movement is
a CSS scroll-driven animation or an IntersectionObserver reveal. There is no scroll
hijacking, no smooth-scroll library, no GSAP, Lenis or Motion.

Composition: `src/app/[locale]/page.tsx`; scenes: `src/components/home/`.

## Scene map and pacing

Like film editing, the energy rises and falls on purpose.

| #   | Scene                 | Energy          | World        | Enters by | Leaves by |
| --- | --------------------- | --------------- | ------------ | --------- | --------- |
| 01  | Arrival (`HeroStage`) | quiet, tension  | MARTIN.G     |           |           |
| 02  | The statement         | monumental peak | MARTIN.G     | (stage)   | recedes   |
| 03  | Bridge (`WorkBridge`) | quiet bridge    | MARTIN.G     | cut       |           |
| 04  | ON (`OnWorld`)        | takeover, warm  | ON cream     | wipe      |           |
|     | ON, second register   | emotional       | ON bordeaux  | wipe      | wipe      |
|     | Reset (`ReturnScene`) | a breath        | MARTIN.G     | dissolve  |           |
| 05  | mi-ma-mo              | technical peak  | mi-ma-mo     | split     | split     |
| 06  | Confidential          | deliberate drop | confidential | cut       |           |
| 07  | How I work            | rhythmic        | MARTIN.G     | dissolve  |           |
| 08  | Capabilities          | calm            | MARTIN.G     | cut       |           |
| 09  | About                 | calm, warm      | MARTIN.G     | cut       |           |
| 10  | Contact               | strong close    | MARTIN.G     | cut       |           |

## Transitions (four, each with one meaning)

| Transition | Meaning                                                   | Motion                                                       |
| ---------- | --------------------------------------------------------- | ------------------------------------------------------------ |
| `wipe`     | a project world takes over the whole experience           | from a framed panel inside the page margins to full bleed    |
| `split`    | a technical, structured world takes over                  | from a center seam outward, hard mechanical edge, grid draws |
| `dissolve` | the atmospheric return to the MARTIN.G world              | fades in over the tail of the previous world                 |
| `cut`      | restraint (confidential work) and calm changes of subject | none                                                         |

A world hands the frame back the way it took it (`exit`): a `wipe` world closes back to a
framed panel while the MARTIN.G black returns around it; a `split` world contracts back into
its seam. Entering scenes overlap the previous one by `--scene-overlap`, so the previous
world stays visible around the opening one.

## Stages (sticky frames)

Two scenes are **stages**: a tall section with a sticky, viewport-sized frame, driven by a
named CSS view timeline (`--hero`, `--process`). The visitor scrolls at their own speed; the
frame holds still while the story moves.

- **Hero** (`--hero`, 200 / 230 / 250svh): the wordmark arrives centered and larger, then
  settles at the inline start; the statement rises out of a mask; the cropped depth type
  drifts against the reading direction; the light moves; the grid appears only inside the
  light; at the end the statement recedes as the frame releases into the bridge.
- **How I work** (`--process`, a viewport plus 45svh per step): five states share one
  composition. Each word enters from a mask, its line follows, then it leaves upward; a
  five-part progress rule fills in the reading direction; the haze clears and the grid
  sharpens across the sequence (ambiguity to clarity).

Stages only switch on under `(scripting: enabled) and (prefers-reduced-motion:
no-preference) and (height >= 34rem)` with scroll-timeline support. Otherwise the same markup
is a static composition (the hero frame; a vertical, ruled sequence of the five steps).
`height >= 34rem` keeps short and zoomed viewports (for example 200% zoom on a laptop) on the
reflowing static layout, so nothing can be trapped in a sticky frame.

## Worlds

- **MARTIN.G**: graphite, directional warm light, grain, vignette, cropped depth type. Grid
  only inside the light, registration marks only in the hero. Never all layers at full
  strength at once.
- **ON**: cream, bordeaux, olive, warm black, paper texture, soft side light; photography
  stand-ins until Phase 4. The title owns the frame.
- **mi-ma-mo**: cool dark graphite, drawn grid, dot field, registration marks, an
  operational board (lanes on a time axis, a day's load rhythm) that fills in along the axis.
  On exit its grid, dots and marks fade and its accent drains (`--world-signal`, 1 to 0), so
  the frame is near-monochrome before the confidential scene.
- **Confidential**: flat monochrome graphite, no light, no texture, generated geometry, strong
  type, almost no motion. Sanitized summaries only; no links, routes, media or identifying
  detail.

ON and mi-ma-mo palettes are provisional (`src/content/worlds.ts`) until the brand values are
supplied.

## Header

The header stays sticky and minimal (wordmark or MG, Work, EN / HE). `HeaderWorld` watches a
one-pixel band along the header's lower edge; the scene crossing it lends the header its
semantic colors (surface, text, muted text, lines, focus ring), crossfaded over
`--dur-standard` (instant with reduced motion). Where two scenes overlap during a transition
the entering one wins. Every world is contrast-validated, so the header is readable over
MARTIN.G, ON cream, ON bordeaux, mi-ma-mo and confidential. Without JavaScript it keeps the
MARTIN.G colors (always readable: it has its own solid background). The browser theme color
follows the world too.

## Responsive choreography

- **Desktop** (≥ 1200px): the full version. Longest stages, strongest parallax (`--parallax:
1`), near-edge statement, depth numerals, side-by-side compositions (ON title and portrait,
  mi-ma-mo text and board).
- **Tablet** (768 to 1199px): recomposed, not scaled. Shorter stages, half parallax, the
  arrival wordmark scales less, compositions stack earlier.
- **Mobile** (< 768px): vertical choreography. The statement sets over four lines (English)
  or two (Hebrew) at near-viewport size; no parallax (`--parallax: 0`); the ON portrait and the
  board stack under the text; the process words are fitted to the width (Hebrew verbs set much
  larger than English words, which are longer).

## RTL

Light direction, depth-type drift, the arrival translation, the bridge and reset rules, the
board's fill origin, the progress rule and all arrows mirror through `--dir` and logical
properties. Wipes and splits are symmetric. The statement and wordmark anchor at the inline
start (right in Hebrew). Project names and numerals stay Latin and isolated (`<Ltr>`).

## Reduced motion, no JavaScript, forced colors

- **Reduced motion**: every scene shows its final state; stages become static compositions;
  no wipes, splits, dissolves, drift or parallax; world colors, hierarchy and spacing are
  unchanged; scrolling is natural.
- **No JavaScript**: the CSS choreography still works where supported (it needs no script),
  reveals never hide anything, and the header keeps the MARTIN.G colors.
- **Forced colors**: atmosphere, depth type and the operational board are removed; text,
  focus and structure remain.

## Performance and accessibility notes (compromises)

- Movement uses `translate`, `scale`, `opacity` and `clip-path`; the only filter is a static
  blur on the light shaft (never animated). The one non-transform animation is the board's
  scan line, a hairline.
- The accent drain is a registered custom property (`@property --world-signal`), animated
  over a small board only.
- Text is never faded to partial opacity while it has to be read: titles move but stay
  opaque; the statement dims only while it leaves the frame.
- The arrival deliberately shows the wordmark first and reveals the statement on scroll. The
  statement is in the document from the start (read by assistive technology, visible without
  scroll-timeline support or with reduced motion).
- The contact action is not rendered until its destination exists (Phase 6), so the CTA has
  no dead link.

## Copy

New homepage copy (How I work, Capabilities, About, Contact) is proposed, not approved:
`src/i18n/dictionaries/home.ts` is marked `draft` in both locales, so a Vercel production
build refuses it until Martin approves it. Hebrew is a natural equivalent (infinitives and
plural address rather than gendered first person), for Martin to confirm.
