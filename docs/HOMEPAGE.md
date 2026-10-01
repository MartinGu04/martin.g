# Homepage choreography (Phase 3; real media in Phase 4; vitality pass in 4.5)

The homepage is one continuous sequence of scenes, `scene → scene → scene`, held together by
the MARTIN.G grammar (docs/DESIGN-SYSTEM.md). Scrolling is always native: every movement is
a CSS scroll-driven animation, an IntersectionObserver reveal, or an ambient loop that runs
while a scene is visible. There is no scroll hijacking, no smooth-scroll library, no GSAP,
Lenis or Motion.

Composition: `src/app/[locale]/page.tsx`; scenes: `src/components/home/`.

## Principles

- **Identity, proposition, proof, quickly.** Within the first viewport and about two seconds:
  MARTIN.G, Martin Gusin, Product Builder, the positioning and the principle. The work
  starts about one viewport later, with an index of everything that was built.
- **Loud and quiet.** The principle (`From problem to product.`) is the one oversized
  typographic moment. Project titles, the process word and capability names sit at least a
  step below it; in the worlds the real work carries the scene, not the title.
- **Alive when still.** A visitor who stops scrolling still sees the page breathe: slow
  drifts, real views taking turns, a process that advances, a scan, a rail. Restrained,
  never decorative noise, never on every element (see Ambient loops).
- **Varied density.** Scenes are as tall as their content: spacious where the moment
  deserves it (the hero, ON), dense where the proof is (המחלבה, Defense Systems,
  Capabilities). No empty height for cinematic effect.
- **Color identifies worlds.** Each world has its own controlled palette (below); no
  unrelated accents.
- **Transitions only where the world changes**, short, and each world enters its own way.

## Scene map and pacing

| #   | Scene                                 | Energy          | World / register       | Enters by | Leaves by |
| --- | ------------------------------------- | --------------- | ---------------------- | --------- | --------- |
| 01  | Identity (`HeroScene`)                | strong, clear   | MARTIN.G dark          | timed     |           |
| 02  | Index of the work (`WorkBridge`)      | quiet bridge    | lighter graphite       | cut       |           |
| 03  | ON (`OnWorld`)                        | warm, intimate  | cream, bordeaux, gold  | soft wipe |           |
| 04  | המחלבה (`MiMaMoWorld`)                | technical peak  | midnight, green, amber | split     | split     |
| 05  | Defense Systems (`ConfidentialScene`) | controlled drop | gunmetal, steel        | cut       |           |
| 06  | How I work (`ProcessStage`)           | rhythmic        | graphite, warm white   | dissolve  |           |
| 07  | Capabilities                          | calm, daylight  | bone, ink, warm accent | cut       |           |
| 08  | About                                 | calm, warm      | warm brown, cream      | cut       |           |
| 09  | Contact                               | strong close    | graphite, amber        | cut       |           |

The hero is one frame with three timed beats (about two seconds in all, masks that fill
backwards only): the wordmark then Martin Gusin, Product Builder; the positioning; the
principle. Nothing requires scrolling.

Heights reduced in 4.5: How I work (from a viewport plus 140svh of sticky stage to its
compact content), Contact (no longer a full frame), ON, Defense Systems, Capabilities and
About (smaller padding), המחלבה (one product frame instead of a frame plus a strip).

## Transitions (four, each with one meaning)

| Transition | Meaning                                              | Motion                                                                  |
| ---------- | ---------------------------------------------------- | ----------------------------------------------------------------------- |
| `wipe`     | a project world takes over the whole experience      | from a framed panel to full bleed (ON: just inside the margins, softer) |
| `split`    | a technical, structured world takes over             | from a center seam outward, hard mechanical edge, grid draws            |
| `dissolve` | the atmospheric return to the MARTIN.G world         | fades in over the tail of the previous world                            |
| `cut`      | restraint (defense work) and calm changes of subject | none                                                                    |

Inside the worlds the media enter in their own language: ON's photograph develops into
place (scale 1.07 to 1), the המחלבה product screen opens from the same center seam as its
world, the Defense Systems boundary draws from its corners. A world may hand the frame back
the way it took it (`exit`): המחלבה contracts back into its seam before Defense Systems.
Entering scenes overlap the previous one by `--scene-overlap`.

## Ambient loops

Continuous motion while a scene is visible and the visitor does nothing (motion.css). A loop
runs only inside an ambient scene (`<Scene ambient>`) that is on screen: the motion
controller marks visible ambient scenes `data-live`, and every `data-loop` element pauses
otherwise. Loops exist only under `(scripting: enabled) and (prefers-reduced-motion:
no-preference)`; a loop that hides anything also needs `:root[data-motion]` to be `pending`
or `on`, so it falls back to a static layout. Before the controller runs, loops hold their
first frame.

| Scene        | Loop                                                                                                         | Period          |
| ------------ | ------------------------------------------------------------------------------------------------------------ | --------------- |
| ON           | the garden photograph drifts (scale 1.04 to 1.1, a slow pan)                                                 | 32s, alternate  |
| ON           | the website print turns between its opening screen and its story section                                     | 14s (7s each)   |
| המחלבה       | home, Team Week and the manager area take turns in one frame; the current label brightens and its rule fills | 15s (5s each)   |
| Defense      | a soft scan crosses each diagram; pulses travel along paths                                                  | 11s / 13s; 7s   |
| How I work   | the current step advances: list highlight, frame word and line, five-part rule                               | 16s (3.2s each) |
| Capabilities | one rail of the capability names                                                                             | 120s            |
| Contact      | an amber hairline draws and clears; product, system, experience take turns                                   | 9s; 10.5s       |
| all scenes   | the atmosphere's haze drift (existing), now also paused offscreen in ambient scenes                          | 48s             |

Crossfades lay the incoming view over the outgoing one, which stays opaque beneath it, so
the frame never dips. Nothing is a carousel: no controls, no swiping, no fast cuts.

## Worlds

- **MARTIN.G**: graphite, directional warm light, grain, vignette, one cropped depth line in
  the hero. Registers (`src/content/worlds.ts`): lighter graphite with a restrained amber
  (index, contact), bone with a warm accent (capabilities), warm (about).
- **ON**: the retreat. Cream, bordeaux, gold (the monogram), olive details, paper texture,
  soft side light. The title is the real ON monogram. The retreat's own garden is the
  dominant frame (3:2, a 4:5 crop on phones) and drifts slowly; the live website sits on a
  bordeaux mat over its lower inline-start corner and turns between two real views; a small
  print of a stop on the route (the patisserie) lies over its upper inline-end corner from
  tablet up. Actions: `View project` (primary), `Visit live site` (secondary: muted,
  underlined, a diagonal arrow, new tab, no opener or referrer). The client's preview film
  stays on the project page: its burned-in PREVIEW watermarks would not suit a loop here.
- **המחלבה** (id `mi-ma-mo`): midnight blue from the real interface, its operational green
  and amber; drawn grid, dot field, registration marks. The title is one step below the
  display peak; the product carries the scene: one large frame where three real sanitized
  views take turns, labelled like technical annotations, and one phone. The interface reads
  right to left, so its quiet side is always the physical left: the phone stands there in
  both directions (inline start in English, inline end in Hebrew). Phones: no desktop
  screen; the phone, then the few Team Week columns that stay legible. With reduced motion
  or without scripting the three views are set out as a static grid. On exit its grid, dots
  and marks fade and its accent drains (`--world-signal`, 1 to 0). No live-site link.
- **Defense Systems** (the confidential projects; `מערכות ביטחוניות`): operational systems
  built for a defense environment. Gunmetal and steel with one cold accent; one framed
  archive (a lighter inner surface, a hairline boundary, restrained corner marks), a
  technical header (title, rule, index range 03–04) and the truthful note that identifying
  details and interfaces are withheld. Each project has a generated system diagram
  (`SystemDiagram`): topology or data pathways with masked structural blocks, a slow scan
  and travelling pulses. Abstract and recognisably so: no interface, labels, coordinates or
  data. Never classified, warning, clearance or dossier language or styling; the page is
  not access controlled and does not pretend to be. Sanitized summaries only.
- **How I work**: graphite and warm white. The five steps are a compact ordered list; while
  visible the process advances on its own and a frame beside the list (above it on phones)
  shows the current word, its line and a five-part rule. Without motion: the list alone.
- **Capabilities**: a clear headline and its claim, the six disciplines at a supporting
  scale with their proof, and one very slow rail of the same names.
- **About**: Martin's portrait (the full-resolution original, cropped and graded only) as one
  quiet print at the inline start, 4:5 from tablet up, a closer square crop first on phones.
- **Contact**: compact; the call to action unchanged, with one amber hairline and a slow word
  cycle beside it.

The public name of the second project is המחלבה; its id, slug and code identifiers stay
`mi-ma-mo`. Project names render through `<Name>`, which isolates Latin names left to right
and Hebrew names right to left (with `lang="he"` on English pages).

## Header

The header stays sticky and minimal (wordmark or MG, Work, EN / HE). `HeaderWorld` watches a
one-pixel band along the header's lower edge; the scene crossing it lends the header its
semantic colors, crossfaded over `--dur-standard` (instant with reduced motion). Every world
is contrast-validated, so the header is readable over every register and world. Without
JavaScript it keeps the MARTIN.G colors.

## Responsive choreography

- **Desktop** (≥ 1200px): side-by-side compositions; full parallax on the photographs.
- **Tablet** (768 to 1199px): recomposed on 8 columns (ON's prints under the text, the
  product frame at full width), half parallax.
- **Mobile** (< 768px): vertical, strong single images: ON's garden in 4:5 with the site's
  phone screen; המחלבה's phone and a legible Team Week crop; the process frame above the
  list; no parallax.

## RTL

Light direction, the index rule, the progress rules, the bordeaux mat, the rail direction and
all arrows mirror through `--dir` and logical properties. Wipes and splits are symmetric.
Deliberate exception: the המחלבה phone keeps the physical left in both directions, because
the product's own interface is right to left. Project names and numerals stay isolated.

## Reduced motion, no JavaScript, forced colors

- **Reduced motion**: every scene shows its final state; no wipes, splits, dissolves, drift,
  parallax or loops; the process is its list, the product views a static grid, the ON print
  its first view; world colors, hierarchy and spacing are unchanged.
- **No JavaScript**: the scroll-driven choreography still works where supported, reveals and
  loops never hide anything, and the header keeps the MARTIN.G colors.
- **Forced colors**: atmosphere, depth type and the system diagrams are removed;
  photographs, product screens, text, focus and structure remain.

## Performance and accessibility notes (compromises)

- Loops animate `transform`, `opacity`, `color`, `z-index` (discrete) and the
  `stroke-dash*` of a few short SVG paths; no filters, no layout properties. They pause
  offscreen, so at most one or two ambient scenes animate at a time.
- The accent drain is a registered custom property (`@property --world-signal`).
- Text that has to be read is never faded: the list of steps and the capabilities stay at
  full opacity; only their decorative echoes (the process frame, the rail, the contact
  words) move, and those are hidden from assistive technology.
- Grain is the world's ink through a noise mask, never a blend mode.
- The contact action is not rendered until its destination exists (Phase 6).

## Copy

The homepage copy (How I work, Capabilities, About, Contact) lives in
`src/i18n/dictionaries/home.ts` and is approved by Martin in both locales. It keeps its own
review state: marking either locale `draft` again makes the release gate refuse a Vercel
production build. Hebrew is a natural equivalent (infinitives and plural address rather
than gendered first person), not a literal translation.

## Real media (Phase 4)

- **Sources.** Only supplied, approved assets, processed outside the repository and committed
  as sRGB, metadata-free sources in `src/assets/` (static imports, so every image has
  intrinsic dimensions and a blur placeholder). Next serves them as WebP at the requested
  width (`images.formats`; AVIF was measured at 5 to 10 times the encode time, which each new
  deployment's first visitors would wait for); the originals never ship.
- **Art direction.** `MediaFrame` renders a `<picture>` when an image has per-tier sources
  (`art.mobile`, `art.tablet`), and the frame reserves each tier's ratio, so nothing shifts.
- **Loading.** The homepage opens on type, so none of its images is eager; each project page
  preloads only its cover.
- **Privacy.** Product screens are sanitized in their pixels before they enter the repo:
  personnel names become neutral bars, insignia and one internal module are painted out, and
  screens dense with personal schedules are not published. Nothing is hidden with CSS.
- **Video.** Only the client's watermarked, silent preview, re-encoded without metadata and
  played by `PreviewVideo`: no native controls (one play / pause button), no download,
  picture-in-picture or casting, context menu and dragging refused on the picture. The
  `<video>` is mounted only after hydration, because without JavaScript a browser must show
  native controls. These are deterrents, not protection: the browser has to receive the file
  to play it. The protection is that the published file is already a preview.
