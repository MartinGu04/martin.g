# Homepage choreography (Phase 3; real media in Phase 4; vitality 4.5; continuity 4.6; polish 4.7 and 4.8)

The homepage is one continuous sequence of scenes, `scene → scene → scene`, held together by
the MARTIN.G grammar (docs/DESIGN-SYSTEM.md). Scrolling is always native: every movement is
a CSS scroll-driven animation, an IntersectionObserver reveal, or an ambient loop that runs
while a scene is visible. There is no scroll hijacking, no smooth-scroll library, no GSAP,
Lenis or Motion.

Composition: `src/app/[locale]/page.tsx`; scenes: `src/components/home/`.

## Principles

- **One story, many worlds.** Martin identifies problems; ON shows the human, brand and
  experience side; המחלבה the operational product; Internal Systems complex systems that
  cannot be fully shown; How I Work the thinking; Capabilities the disciplines; About the
  person; Contact the invitation. A thread carries each world's color into the next (see
  The thread) so the page reads as one builder moving between worlds.

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
  deserves it (the hero, ON), dense where the proof is (המחלבה, Internal Systems,
  Capabilities). No empty height for cinematic effect.
- **Color identifies worlds.** Each world has its own controlled palette (below); no
  unrelated accents.
- **Transitions only where the world changes**, short, and each world enters its own way.

## Scene map and pacing

| #   | Scene                                  | Energy          | World / register       | Enters by | Leaves by |
| --- | -------------------------------------- | --------------- | ---------------------- | --------- | --------- |
| 01  | Identity (`HeroScene`)                 | strong, clear   | MARTIN.G dark          | timed     |           |
| 02  | Selected Work chapters (`WorkBridge`)  | quiet bridge    | lighter graphite       | cut       |           |
| 03  | ON (`OnWorld`)                         | warm, intimate  | cream, bordeaux, gold  | soft wipe |           |
| 04  | המחלבה (`MiMaMoWorld`)                 | technical peak  | midnight, green, amber | split     | split     |
| 05  | Internal Systems (`ConfidentialScene`) | controlled drop | gunmetal, steel        | cut       |           |
| 06  | How I Work (`ProcessStage`)            | rhythmic        | graphite, warm white   | dissolve  |           |
| 07  | Capabilities                           | calm, daylight  | bone, ink, warm accent | cut       |           |
| 08  | About                                  | calm, warm      | warm brown, cream      | cut       |           |
| 09  | Contact                                | strong close    | graphite, amber        | cut       |           |

The hero is one frame with three timed beats (about two seconds in all, masks that fill
backwards only): Martin Gusin, Product Builder; the positioning; the principle. On
desktop the MG symbol is drawn once behind them as a single hairline outline, cropped
past the inline end (on the left in Hebrew; the symbol itself is never mirrored). Nothing
requires scrolling.

Heights reduced in 4.5: How I Work (from a viewport plus 140svh of sticky stage to its
compact content), Contact (no longer a full frame), ON, Internal Systems, Capabilities and
About (smaller padding), המחלבה (one product frame instead of a frame plus a strip).

## The thread (4.6)

One short hairline at the top of each scene (`<Thread>`, docs/DESIGN-SYSTEM.md), a gradient
from the previous world's color to the arriving one, drawn in as the scene arrives:

| Handoff                       | From → to                    |
| ----------------------------- | ---------------------------- |
| index → ON                    | warm white → ON gold         |
| ON → המחלבה                   | ON gold → amber              |
| המחלבה → Internal Systems     | amber → cold steel           |
| Internal Systems → How I Work | cold steel → warm white      |
| How I Work → Capabilities     | warm white → the bone accent |
| Capabilities → About          | the bone accent → lamplight  |
| About → Contact               | lamplight → amber, resolved  |

Selected Work is the table of contents for the worlds ahead (4.7): three chapters (01 ON,
02 המחלבה, 03–04 Internal Systems), each a rule, number and focus color in its world's
accent, a title, one line, and a small glimpse of the world (a real ON website crop, a
sanitized המחלבה screen, the Defense geometry drawn still). Glimpses rest muted and come to
full color on hover or focus; each chapter links to its scene. Inside the worlds the thread
is echoed in each world's own language: the process rule (a scan), the capability rail, the
evidence rule under each capability. In Contact it resolves (see Contact below). The hero's
one ambient layer is its directional light, drifting very slowly (40s, alternate).

The full MARTIN.G wordmark appears only in the header and the footer (4.7, brand polish);
the hero names Martin in type, and no interior scene uses a brand mark as decoration.

## Depth and texture (4.8)

Composition first, then depth, then texture; nothing here is a concept of its own.

- **Hero**: the positioning and the principle sit at the optical center of the frame below
  the identity (a little more space below than above), no longer anchored low.
- **Selected Work**: a compact editorial section (a table of contents, not another hero;
  the viewport-tall frame tried in 4.8 was reverted). ON's chapter carries its identity
  beside its name, quieter than it (`ריטריט היכרויות בגליל` /
  `Dating Retreat in the Galilee`).
- **Shared image depth** (ON, המחלבה, About): long, soft, low shadows in the world's shade
  and, on dark worlds, a faint edge of the world's light; foreground devices rest on a
  contact shadow (ON's phone as a box shadow under its mat, the המחלבה phone as a drop
  shadow that follows the device). No gloss, no perspective, no floating cards.
- **ON**: a far, heavily blurred, warmed crop of the venue (one small image, about 16% of
  the frame's width in pixels) and three faint washes of bordeaux, olive and gold behind
  the world. The phone is larger, overlaps the site frame more deeply and hangs below it.
- **Internal Systems**: `SystemField`, a static, very faint SVG field behind the archive:
  out-of-focus panel silhouettes (some with the rhythm of rows, never content), two grid
  fragments, orthogonal topology with square nodes and two cold traces. No screenshots,
  text or data; the archive's surface lets it through only at about 10%.
- **How I Work**: one line glyph per stage (`ProcessGlyph`: focus, boundary, grid,
  modules, loop) above the large current word in the frame (about 28 to 38px, muted),
  changing with the word on the same clock and following the pointer takeover. The list
  rows carry no glyphs.
- **Contact**: the convergence drawing is the 4.7 geometry unchanged; its draw-in now
  completes while the scene's upper half comes into view (entry 0% to 40%), so the
  schematic is never seen half drawn while the invitation is readable.
- **Capabilities**: unchanged; the bone world already carries its fine light grain (the
  light scheme's 0.12), so no second texture is added.
- **Texture per world**: ON paper and its haze, המחלבה its grid and dots, Defense its field,
  Capabilities its grain, About the warm grain; hero and Selected Work stay mostly clean.

## Transitions (four, each with one meaning)

| Transition | Meaning                                              | Motion                                                                  |
| ---------- | ---------------------------------------------------- | ----------------------------------------------------------------------- |
| `wipe`     | a project world takes over the whole experience      | from a framed panel to full bleed (ON: just inside the margins, softer) |
| `split`    | a technical, structured world takes over             | from a center seam outward, hard mechanical edge, grid draws            |
| `dissolve` | the atmospheric return to the MARTIN.G world         | fades in over the tail of the previous world                            |
| `cut`      | restraint (defense work) and calm changes of subject | none                                                                    |

Inside the worlds the media enter in their own language: ON's photograph develops into
place (scale 1.07 to 1), the המחלבה product screen opens from the same center seam as its
world, the Internal Systems boundary draws from its corners. A world may hand the frame back
the way it took it (`exit`): המחלבה contracts back into its seam before Internal Systems.
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
| Hero         | the directional light drifts across the frame                                                                | 40s, alternate  |
| ON           | the garden photograph drifts (scale 1.04 to 1.1, a slow pan)                                                 | 32s, alternate  |
| ON           | the website frame turns between its opening screen and its story section                                     | 14s (7s each)   |
| המחלבה       | home, Team Week and the manager area take turns in one frame; the current label brightens and its rule fills | 15s (5s each)   |
| Defense      | a soft scan crosses each diagram; pulses travel along paths                                                  | 11s / 13s; 7s   |
| How I Work   | the current step advances: list highlight, frame word and line, five-part rule; a pointer takes over         | 16s (3.2s each) |
| Capabilities | one rail of the capability names                                                                             | 120s            |
| Contact      | a short pulse travels along each converging strand toward the meeting point                                  | 14s, staggered  |
| all scenes   | the atmosphere's haze drift (existing), now also paused offscreen in ambient scenes                          | 48s             |

Crossfades lay the incoming view over the outgoing one, which stays opaque beneath it, so
the frame never dips. Nothing is a carousel: no controls, no swiping, no fast cuts.

## Worlds

- **MARTIN.G**: graphite, directional warm light, grain, vignette, one cropped depth line in
  the hero. Registers (`src/content/worlds.ts`): lighter graphite with a restrained amber
  (index, contact), bone with a warm accent (capabilities), warm (about).
- **ON**: the retreat. Cream, bordeaux, gold (the monogram), olive details, paper texture,
  soft side light. The title is the real ON monogram; the summary is a statement. Digital
  work first, composed like a product launch (4.7): one dominant frame of the live website
  on a bordeaux mat with a gold edge, turning between two real views; its phone layout as a
  small device in front of the frame's lower inline-start corner (cream mat, gold edge); the
  retreat's garden behind, upper inline end, as the only atmosphere, drifting slowly. The
  patisserie stays on the project page. Phones: the garden as a band, the website's phone
  layout large over it. Actions: `View project` (primary, over a bordeaux rule) and
  `Visit live site` (secondary: muted, underlined, a diagonal arrow, new tab, no opener or
  referrer). The preview film stays on the project page.
- **המחלבה** (id `mi-ma-mo`): midnight blue from the real interface, its operational green
  and amber, the interface's controlled blue for small details; drawn grid, dot field,
  registration marks. Since 4.7 the whole composition fits one viewport below the header
  on a desktop (tested at 1440 x 900, 1366 x 768 and 1920 x 1080): the title on its own
  line, then the statement, action and note at the inline start beside the product block.
  The product block is a container: the phone takes about 30% of it (less on a short
  viewport, capped by `100svh - header`), the frame with its three cycling views and labels
  takes the rest, capped the same way, so nothing spills below. The interface reads right to
  left, so its quiet side is always the physical left: the phone stands there in both
  directions (in English the view labels start after it). Phones: no desktop screen; the
  phone, then the few Team Week columns that stay legible. With reduced motion or without
  scripting the three views are set out as a static grid. On exit its grid, dots and marks
  fade and its accent drains (`--world-signal`, 1 to 0). No live-site link.
- **Internal Systems** (the confidential projects; `מערכות פנימיות`, renamed in Phase 8C):
  internal projects presented in a limited form. Gunmetal and steel with one cold accent;
  one framed archive (a lighter inner surface, a hairline boundary, restrained corner
  marks), a technical header (title, rule, index range 03–04) and the truthful note that
  some interface details are omitted or obscured (at body size since 4.6). Each project
  has a generated system diagram (`SystemDiagram`): topology or data pathways with masked
  structural blocks, a slow scan and travelling pulses. Abstract and recognisably so: no
  interface, labels, coordinates or data. The one exception since Phase 8C is
  `confidential-01`'s approved, fully anonymized interface image (docs/ARCHITECTURE.md,
  "Confidential covers"). Never classified, warning, clearance or dossier
  language or styling; the page is not access controlled and does not pretend to be.
  Sanitized summaries only.
- **How I Work** (`דרך העבודה`): graphite and warm white. A real section heading and its
  thought (`How a problem becomes a product.` / `איך בעיה הופכת למוצר.`), then the five
  steps as a compact ordered list; while visible the process advances on its own and a
  frame beside the list (above it on phones) shows the current word (a heading size, not a
  poster), its line and a five-part rule. A fine pointer over a step makes it current and
  holds the clock; when the pointer leaves the clock continues where it was. Scroll does
  not drive the steps: two clocks (scroll and time) on one list fight each other. Without
  motion: the list alone.
- **Capabilities**: a clear headline and its claim, one very slow rail of the names, then a
  proof system: an editorial grid (three columns on a desktop) where each discipline is its
  number (rust) and a small custom glyph (`CapabilityGlyph`: 22px, hairline strokes on the
  24-unit grid, muted sage, noticed second), its name, one sentence of what it means, and
  the real work that proves it, linked to that work's scene on this page
  (`src/content/capabilities.ts`). Type, hairlines and glyphs only: no cards, no metrics.
- **About**: a portrait of the builder on a clear grid: the portrait as a large print in an
  offset lamplight mat; beside it Martin Gusin (a heading size, quieter than the quote) and
  Product Builder in lamplight, the authored quote as the anchor
  (`I don't start with a screen. I start with the problem.`) with the sentence that grounds
  it, and along the portrait's bottom edge the three disciplines that sentence names
  (strategy, design, engineering) as nodes on one line. Not a biography, not a testimonial.
- **Contact**: compact; `Have a problem worth solving?` then, in amber, `Let’s build something
worth using.` / `בואו נבנה משהו ששווה להשתמש בו.` (4.8), balanced over two lines. Beside it
  the resolution of the page's visual language (`Convergence`): product, system and
  experience arrive as three orthogonal strands in the colors of the worlds that showed them
  (המחלבה's amber, Defense steel, ON's gold), meet at one node and continue as the one
  amber thread toward the invitation, ending in the open square. The strands draw in once;
  while the visitor stays a short pulse travels along each, very slowly. No wordmark.
  Under the invitation its one action (Phase 6): `Start a project`, amber, with the arrow.
- **Exploring a project** (ON, המחלבה): the explicit `View project` link stays visible on
  every device. On a fine pointer the main proof frame also leads to the project page and a
  quiet `Explore project` chip rises in its corner on hover, or while the scene's project
  link has keyboard focus (`ExploreFrame`). The frame's link is a layer over the media
  (which keep their alternative text), hidden from assistive technology and skipped by the
  keyboard as a duplicate. Supporting images never link.

The public name of the second project is המחלבה; its id, slug and code identifiers stay
`mi-ma-mo`. Project names render through `<Name>`, which isolates Latin names left to right
and Hebrew names right to left (with `lang="he"` on English pages).

## Header

The header stays sticky and minimal (wordmark or MG symbol, Work, About, Contact, EN / HE;
one row at every width, under 360px only the other language's code). `HeaderWorld` watches a
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
- The contact action (Phase 6) is the one solid control on the page: `Start a project` /
  `מתחילים פרויקט`, amber where the thread comes to rest, leading to `/[locale]/contact`.

## Copy

The homepage copy (How I Work, Capabilities, About, Contact) lives in
`src/i18n/dictionaries/home.ts` and is approved by Martin in both locales. It keeps its own
review state: marking either locale `draft` again makes the release gate refuse a Vercel
production build. Hebrew is a natural equivalent (infinitives and plural address rather
than gendered first person), not a literal translation.

The capability statements (4.6) live with the showcase copy (`src/i18n/dictionaries/showcase.ts`):
English as Martin supplied it, Hebrew written for review, so that dictionary stays `draft`
until Martin approves it. The process heading, its thought and the About quote and support
line are Martin's own words in both locales.

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
