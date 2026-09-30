# Homepage choreography (Phase 3)

The homepage is one continuous sequence of scenes, `scene → scene → scene`, held together by
the MARTIN.G grammar (docs/DESIGN-SYSTEM.md). Scrolling is always native: every movement is
a CSS scroll-driven animation or an IntersectionObserver reveal. There is no scroll
hijacking, no smooth-scroll library, no GSAP, Lenis or Motion.

Composition: `src/app/[locale]/page.tsx`; scenes: `src/components/home/`.

## Principles (restraint pass)

- **Identity, proposition, proof, quickly.** Within the first viewport and about two seconds:
  MARTIN.G, Martin Gusin, Product Builder, the positioning and the principle. The work
  starts about one viewport later, with an index of everything that was built.
- **Loud and quiet.** Extreme scale is reserved for one moment (the principle) and one world
  (mi-ma-mo). Everything else is a step or two below: project titles are confident, not
  gigantic; How I work, About and Contact are strong but calmer than the statement.
- **Light and color.** MARTIN.G stays fundamentally dark, but the page moves through tones:
  dark graphite, lighter graphite, ON cream, technical dark, soft neutral, bone, warm.
- **Transitions only where the world changes**, and short: about 40% shorter than the first
  Phase 3 pass.

## Scene map and pacing

| #   | Scene                            | Energy          | World / register | Enters by | Leaves by |
| --- | -------------------------------- | --------------- | ---------------- | --------- | --------- |
| 01  | Identity (`HeroScene`)           | strong, clear   | MARTIN.G dark    | timed     |           |
| 02  | Index of the work (`WorkBridge`) | quiet bridge    | lighter graphite | cut       |           |
| 03  | ON (`OnWorld`)                   | warm, intimate  | ON cream         | soft wipe |           |
| 04  | mi-ma-mo                         | technical peak  | mi-ma-mo         | split     | split     |
| 05  | Confidential                     | deliberate drop | soft neutral     | cut       |           |
| 06  | How I work                       | rhythmic        | MARTIN.G dark    | dissolve  |           |
| 07  | Capabilities                     | calm, daylight  | bone             | cut       |           |
| 08  | About                            | calm, warm      | warm             | cut       |           |
| 09  | Contact                          | strong close    | lighter graphite | cut       |           |

The hero is one frame with three timed beats (about two seconds in all, masks that fill
backwards only): the wordmark then Martin Gusin, Product Builder; the positioning; the
principle, set at about 70% of the previous hero scale. Nothing requires scrolling.

## Transitions (four, each with one meaning)

| Transition | Meaning                                                   | Motion                                                                  |
| ---------- | --------------------------------------------------------- | ----------------------------------------------------------------------- |
| `wipe`     | a project world takes over the whole experience           | from a framed panel to full bleed (ON: just inside the margins, softer) |
| `split`    | a technical, structured world takes over                  | from a center seam outward, hard mechanical edge, grid draws            |
| `dissolve` | the atmospheric return to the MARTIN.G world              | fades in over the tail of the previous world                            |
| `cut`      | restraint (confidential work) and calm changes of subject | none                                                                    |

A world may hand the frame back the way it took it (`exit`): a `split` world contracts back
into its seam (mi-ma-mo, before the confidential scene); a `wipe` world can close back to a
framed panel (used in the specimen). Entering scenes overlap the previous one by
`--scene-overlap`, so the previous world stays visible around the opening one. Ranges: wipe
and split finish at `entry 60%` and `entry 55%`, dissolve at `entry 50%`, exits run over the
last 60% of the scene's exit.

## Stage (sticky frame)

One scene is a **stage**: How I work, a short tall section with a sticky frame on a named
CSS view timeline (`--process`, a viewport plus 28svh per step). Five states share one
composition; each word enters from a mask, its line follows, then it leaves upward; a
five-part progress rule fills in the reading direction; the haze clears and the grid
sharpens (ambiguity to clarity). It is supporting content, set one step below the display
peak. It only switches on under `(scripting: enabled) and (prefers-reduced-motion:
no-preference) and (height >= 34rem)` with scroll-timeline support; otherwise it is a
vertical, ruled sequence. `height >= 34rem` keeps short and zoomed viewports on the
reflowing layout.

## Worlds

- **MARTIN.G**: graphite, directional warm light, grain, vignette, one cropped depth line in
  the hero. Grid only inside the light, registration marks only in the hero. Registers
  (`src/content/worlds.ts`): lighter graphite (index, contact), bone (capabilities), warm
  (about).
- **ON**: quiet luxury, editorial hospitality. Cream, breathing room, an editorial pair of
  photographs (stand-ins until Phase 4), bordeaux as an accent (a mat behind one print),
  olive details, paper texture, soft side light. The title is confident but modest; the
  impact is the change of mood.
- **mi-ma-mo**: cool dark graphite, drawn grid, dot field, registration marks, an
  operational board (lanes on a time axis, a day's load rhythm) that fills in along the axis.
  On exit its grid, dots and marks fade and its accent drains (`--world-signal`, 1 to 0), so
  the frame is near-monochrome before the confidential scene.
- **Confidential**: soft flat neutral grey, no light, no texture, flat generated geometry,
  clear type, almost no motion. Sanitized summaries only; no links, routes, media or identifying
  detail.

ON and mi-ma-mo palettes are provisional (`src/content/worlds.ts`) until the brand values are
supplied. The public name of mi-ma-mo becomes המחלבה in Phase 4; the id and slug stay
`mi-ma-mo`.

## Header

The header stays sticky and minimal (wordmark or MG, Work, EN / HE). `HeaderWorld` watches a
one-pixel band along the header's lower edge; the scene crossing it lends the header its
semantic colors (surface, text, muted text, lines, focus ring), crossfaded over
`--dur-standard` (instant with reduced motion). Where two scenes overlap during a transition
the entering one wins. Every world is contrast-validated, so the header is readable over
every register and world on the page (dark, graphite, cream, technical, neutral, bone, warm). Without JavaScript it keeps the
MARTIN.G colors (always readable: it has its own solid background). The browser theme color
follows the world too.

## Responsive choreography

- **Desktop** (≥ 1200px): the identity signature sits beside the wordmark; side-by-side
  compositions (ON text and photographs, mi-ma-mo text and board); full parallax on the
  photographs and depth line.
- **Tablet** (768 to 1199px): the same frames recomposed on 8 columns, half parallax.
- **Mobile** (< 768px): vertical. The identity sits under the wordmark, the statement below the
  positioning; the index stacks; ON's photographs follow its text; no parallax; the process
  words are fitted to the width (Hebrew verbs set larger than the longer English words).

## RTL

Light direction, depth-type drift, the index rule, the board's fill origin, the progress
rule, the bordeaux mat behind ON's print and all arrows mirror through `--dir` and logical
properties. Wipes and splits are symmetric. The wordmark and statement anchor at the inline
start (right in Hebrew); the identity signature at the inline end. Project names and numerals stay Latin and isolated (`<Ltr>`).

## Reduced motion, no JavaScript, forced colors

- **Reduced motion**: every scene shows its final state; the hero beats are simply present;
  the stage becomes a static composition;
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
- Text is never faded to partial opacity while it has to be read: the hero beats are masks,
  titles move but stay opaque.
- Grain is the world's ink through a noise mask, never a blend mode (a blended full-frame
  layer halved the desktop frame rate in profiling).
- The contact action is not rendered until its destination exists (Phase 6), so the CTA has
  no dead link.

## Copy

New homepage copy (How I work, Capabilities, About, Contact) is proposed, not approved:
`src/i18n/dictionaries/home.ts` is marked `draft` in both locales, so a Vercel production
build refuses it until Martin approves it. Hebrew is a natural equivalent (infinitives and
plural address rather than gendered first person), for Martin to confirm.
