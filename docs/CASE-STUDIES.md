# Case studies (Phase 5)

The homepage answers _what does Martin build_; a case study answers _how did he think,
decide and build it_. Each one enters deeper into its project's world: the MARTIN.G header,
grid, type and motion stay the same, while color, light and material belong to the project.
Real material and real decisions only: no fake metrics, testimonials, outcomes or agency
language. Defense Systems never gets a case study.

Composition: `src/components/case-study/` (shared primitives) and one folder per case
study (`on/`, `mi-ma-mo/`). Copy: one dictionary per case study, `draft` until Martin approves it.

## Shared primitives

| Primitive         | What it is                                                                       |
| ----------------- | -------------------------------------------------------------------------------- |
| `ChapterHeading`  | the chapter's h2: marker (number, rule, name, in the world's accent) + statement |
| `ChapterIndex`    | in-page navigation to every chapter; plain anchors, works without JavaScript     |
| `Crop`            | a region of a real image (optionally another region on phones); never a new file |
| `ReadingProgress` | a hairline along the header's lower edge, CSS scroll-driven, decorative          |
| `NextProject`     | the way into the next world: a passage between grounds, then that world's scene  |

Exploration is deliberately light: chapter index, numbered chapter markers, a reading
hairline. No scroll locking, no pinned choreography, no carousel.

## ON (Phase 5A, copy approved)

Route `/[locale]/work/on`. Copy `src/i18n/dictionaries/case-on.ts` (approved by Martin, both locales).
Media: the approved ON assets only (`src/content/projects/on.ts`), plus `onCrops`, regions of
those same files.

| #   | Chapter            | Register | What carries it                                                              |
| --- | ------------------ | -------- | ---------------------------------------------------------------------------- |
|     | Opening            | wine     | the gold monogram (h1), identity line, statement, the live site rising       |
| 01  | The context        | cream    | the retreat in two paragraphs, the guesthouse garden, the format as stated   |
| 02  | The problem        | cream    | four things it must not be, each struck through once, then the aim           |
| 03  | Direction          | cream    | editorial plates: monogram, palette (sampled), type, photography, arch       |
| 04  | From brand to site | wine     | the real navigation and its destinations, the story section, the phone       |
| 05  | Key decisions      | cream    | six decisions, each with its evidence (the site's words or a detail)         |
| 06  | Film               | night    | the watermarked preview in a screening room (wipe)                           |
| 07  | Details            | cream    | craft up close: ribbon, serif numerals, spaced line, the action twice, phone |
| 08  | Result             | wine     | From identity to launch: one live experience, desktop and mobile; live link  |
|     | Next               | המחלבה   | wine darkens into midnight, the grid surfaces, the thread descends; split    |

Rules specific to ON:

- **No formal brand book is claimed.** The identity is shown as plates of real material; the
  copy never calls it a brand book.
- **The mark is not repeated to fill space.** In Details it appears once (the ribbon); the
  other details are type, actions and the phone.
- **Decisions are evidenced.** Every decision points to something visible on the live site
  (its own words, a crop of its screens). The format numbers are the site's own (two days,
  24 participants, 12 + 12, 30+) and are labelled as such; they are not results.
- **Result is objective.** One complete experience, live, on desktop and mobile. Measurable
  results are added only if they are supplied.
- **Screens without capture edges.** The desktop screenshot has a few white pixels along its
  right and bottom edges and the phone screenshot a dark scroll strip; the crops frame the
  screens without them instead of altering the assets.
- **Phones.** The opening frames the desktop screen on the mark, the question and the action
  (a second region of the same file), so the phone screenshot is not repeated four times;
  the story section runs edge to edge; the numbers row shows the two numbers that still
  read at that width.
- **Film.** The same `PreviewVideo` as before: the watermarked preview, no native controls,
  no autoplay, nothing before hydration.
- **Live site.** Linked in the opening and in the result; new tab, no opener or referrer.

### Could strengthen it later

- Material that would strengthen the case study if supplied: the application questionnaire,
  the schedule and winery sections, any process sketches, and measurable results.

## המחלבה (Phase 5B, copy draft)

Route `/[locale]/work/mi-ma-mo` (id and slug unchanged; public name המחלבה). Copy
`src/i18n/dictionaries/case-mi-ma-mo.ts`, **draft in both locales**: the release gate refuses
a Vercel production build until Martin approves it. Media: the approved, sanitized screens
only (`src/content/projects/mi-ma-mo.ts`: Home, Team Week, the manager area, Home on a phone),
plus `miMaMoCrops`, regions of those same files, and `miMaMoMarks`, annotation boxes in their
source pixels. No live link: the product is a signed-in tool, not a public destination.

Not ON in blue. ON is editorial, warm and plated; this world is operational and structured,
and the product carries every chapter. Its own devices, in `src/components/case-study/mi-ma-mo`:

- `Annotated` + `MarkList`: numbered amber boxes measured on the real interface (clipped to
  the phone region on phones), with the same numbers named in a list beside the screen. The
  boxes are decorative; the list carries the meaning.
- `Level`: one scale read at three levels (your shift, the team, the operation), lit per
  chapter from 02 to 04.
- A map of where each state is read (a real table: states by view), and a decision log in
  which every entry is filed with its evidence and the screen it comes from.

| #   | Chapter                        | Register  | What carries it                                                         |
| --- | ------------------------------ | --------- | ----------------------------------------------------------------------- |
|     | Opening                        | midnight  | the name (h1), "Operational product", statement, Home beside its nav    |
| 01  | The context                    | midnight  | what the product is; the map of states by view                          |
| 02  | The operational picture        | midnight  | Home's next-shift card boxed (shift, who is on it, coverage); around it |
| 03  | Built around the week          | midnight  | Team Week across the page, anchored at its day column; one day closer   |
| 04  | Management at a glance         | card blue | one level up (split): the product's own words, the snapshot, emergency  |
| 05  | One system, different contexts | midnight  | the phone at its own size, the same order boxed and listed              |
| 06  | Key decisions                  | midnight  | five decisions, each with its evidence                                  |
| 07  | System details                 | midnight  | the mechanics on a bench: coverage, type levels, today twice, time left |
| 08  | Result                         | midnight  | Many operational states, one working system; four views on one line     |
|     | Closing                        | steel     | midnight into steel; Defense Systems named, not opened; All work        |

Rules specific to המחלבה:

- **Claims stay inside the screens.** Every sentence describes something visible in an
  approved screenshot. No numbers, users, adoption, outcomes or "mobile-first". The emergency
  mode is described only as a panel with its own button, as the screenshot shows it.
- **Nothing removed comes back.** Crops can only show less of the sanitized pixels; no
  overlay, label or text names a removed person, mark or module. The excluded views (the
  month view, the fairness table) are not published or described.
- **Readable proof.** Primary screens draw at about their own size (0.85 to 1.05 of the
  screenshot on a 1440px desktop, tested) and never larger; details at most 1.5 times.
  Phones get their own region of the same file instead of a shrunken screen.
- **Physical screens.** The interface reads right to left, so Team Week is anchored at its
  physical right (the day column) in both languages and runs out past the other edge.
- **No Defense case study.** The closing names Defense Systems with its approved wording and
  links only back to all of the work. No route, no clickable promise, no classified styling.
- **Motion.** Alive while still, never fake data: a trace along the opening screen's top edge,
  a sweep across the map's columns, a slow pulse on today. All three only inside ambient
  scenes, paused offscreen, absent without scripting and with reduced motion. Boxes trace in
  on scroll and are simply drawn otherwise.

### Could strengthen it later

- Material that would strengthen it if supplied and approved: process material (sketches,
  earlier versions), the shifts or people tabs of the manager area in sanitized form, and any
  outcome Martin can state.
