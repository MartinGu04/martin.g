# Case studies (Phase 5)

The homepage answers _what does Martin build_; a case study answers _how did he think,
decide and build it_. Each one enters deeper into its project's world: the MARTIN.G header,
grid, type and motion stay the same, while color, light and material belong to the project.
Real material and real decisions only: no fake metrics, testimonials, outcomes or agency
language. Defense Systems never gets a case study.

Composition: `src/components/case-study/` (shared primitives) and one folder per case
study. Copy: one dictionary per case study, `draft` until Martin approves it.

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
