import Link from 'next/link'
import type { Route } from 'next'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import type { ShowcaseCopy } from '@/i18n/dictionaries/showcase'
import type {
  MiMaMoCaseCopy,
  MiMaMoChapterKey,
  MiMaMoStateKey,
} from '@/i18n/dictionaries/case-mi-ma-mo'
import type { PublicProjectSummary } from '@/content/resolve'
import { miMaMoCrops } from '@/content/projects/mi-ma-mo'
import { thread, worlds } from '@/content/worlds'
import type { StyleWithVars } from '@/lib/css'
import { Grid } from '@/components/layout/Grid'
import { GridLines } from '@/components/layout/GridLines'
import { Arrow } from '@/components/type/Arrow'
import { IndexNumber } from '@/components/type/IndexNumber'
import { Name } from '@/components/type/Name'
import { Reveal } from '@/components/motion/Reveal'
import { Scene } from '@/components/scene/Scene'
import { Thread } from '@/components/scene/Thread'
import { ChapterHeading } from '../Chapter'
import { ChapterIndex, type ChapterLink } from '../ChapterIndex'
import { Crop } from '../Crop'
import { ReadingProgress } from '../ReadingProgress'
import { MiMaMoPicture } from './MiMaMoPicture'
import { MiMaMoWeek } from './MiMaMoWeek'
import { MiMaMoManagement } from './MiMaMoManagement'
import { MiMaMoPhone } from './MiMaMoPhone'
import { MiMaMoDecisions } from './MiMaMoDecisions'
import { MiMaMoDetails } from './MiMaMoDetails'
import styles from './MiMaMoCaseStudy.module.css'

type Summary = PublicProjectSummary & { number: string }

export interface MiMaMoCaseStudyProps {
  locale: Locale
  dict: Dictionary
  showcase: ShowcaseCopy
  copy: MiMaMoCaseCopy
  project: Summary
}

/** Chapter order is the narrative: what it is, then each level of reading, then why. */
const order = [
  'context',
  'picture',
  'week',
  'management',
  'phone',
  'decisions',
  'details',
  'result',
] as const satisfies readonly MiMaMoChapterKey[]

export type MiMaMoChapters = Readonly<Record<MiMaMoChapterKey, ChapterLink>>

type Surface = keyof ShowcaseCopy['miMaMo']['views']

const surfaces = ['home', 'teamWeek', 'manager', 'mobile'] as const satisfies readonly Surface[]

/**
 * Where each state is read, as the approved screens show it (Home, Team Week, the manager
 * area, Home on a phone). Only what is visible: the phone screenshot shows the report
 * shortcut, the next shift, who is on it and its coverage, so that is all it is credited
 * with here.
 */
const map: readonly (readonly [MiMaMoStateKey, readonly Surface[]])[] = [
  ['nextShift', ['home', 'mobile']],
  ['crew', ['home', 'mobile']],
  ['reports', ['home', 'mobile']],
  ['weekAhead', ['home', 'teamWeek']],
  ['entries', ['teamWeek']],
  ['roles', ['teamWeek']],
  ['snapshot', ['manager']],
  ['coverage', ['home', 'manager', 'mobile']],
  ['emergency', ['manager']],
]

/**
 * The המחלבה case study (Phase 5B): how an operational problem became a product, told
 * with the real, sanitized screens only. Not ON in blue: where ON is editorial, warm and
 * plated, this world is operational and structured, and the product carries every
 * chapter. Its own devices: numbered boxes measured on the real interface, a map of where
 * each state is read, a scale of levels (your shift, the team, the operation) and a
 * decision log in which every entry shows its evidence.
 *
 *   opening      midnight   the name, one statement, Home beside its navigation
 *   context      midnight   what the product is; where each state is read (a map)
 *   picture      midnight   Home: the next shift first, boxed on the real screen
 *   week         midnight   Team Week across the page, boxed; one day closer
 *   management   card blue  one level up (split): the snapshot, emergency mode
 *   phone        midnight   the same order on a phone, boxed
 *   decisions    midnight   five decisions, each with its evidence
 *   details      midnight   the mechanics, up close, in pairs where the system repeats
 *   result       midnight   one working system
 *   closing      steel      the next world of work, withheld; the way back to all work
 *
 * Exploration stays native and light: a chapter index, numbered chapter markers and a
 * reading hairline. Nothing locks the scroll. Loops (a trace along the screen's frame, a
 * sweep across the map, today's pulse) run only inside ambient scenes while on screen.
 */
export function MiMaMoCaseStudy({ locale, dict, showcase, copy, project }: MiMaMoCaseStudyProps) {
  const chapters = Object.fromEntries(
    order.map((key, i) => [
      key,
      { id: key, number: String(i + 1).padStart(2, '0'), name: copy.chapters[key] },
    ]),
  ) as unknown as MiMaMoChapters
  const workHref = `/${locale}#work` as Route
  const views = showcase.miMaMo.views

  return (
    <>
      <ReadingProgress color={thread.miMaMo} />

      {/* Opening: the name and one statement, then the real product, large enough to read. */}
      <Scene
        theme={worlds.miMaMo}
        ambient
        as="section"
        aria-labelledby="case-title"
        className={styles.opening}
      >
        <Grid className={styles.openingGrid}>
          <div className={styles.topline}>
            <Link href={workHref} className={`t-label ${styles.back}`}>
              <Arrow className={styles.backArrow} />
              {copy.ui.allWork}
            </Link>
            {/* Latin in both locales: "CASE STUDY / 02" is a visual label, not translated. */}
            <p className={`t-label ${styles.kicker}`} lang="en" dir="ltr">
              {copy.ui.caseStudy}
              <span aria-hidden="true"> / </span>
              <IndexNumber value={project.number} />
            </p>
          </div>
          <div className={styles.identity}>
            <p className={`t-label ${styles.line}`}>
              <span className={styles.lineMark} aria-hidden="true" />
              {showcase.chapters.miMaMo}
            </p>
            <h1 id="case-title" className={`t-display ${styles.title}`}>
              <Name>{project.title}</Name>
            </h1>
          </div>
          <p className={`t-statement ${styles.statement}`}>{copy.opening.statement}</p>

          <figure className={styles.console}>
            <figcaption className={styles.consoleBar}>
              <span className={`t-label ${styles.view}`}>
                <span className={styles.viewNode} aria-hidden="true" />
                {views.home}
              </span>
              <span className={`t-small ${styles.sanitized}`}>{showcase.miMaMo.sanitized}</span>
            </figcaption>
            <div className={styles.screen}>
              <span className={styles.ticks} aria-hidden="true" />
              <span className={styles.trace} aria-hidden="true" data-loop="" />
              <Crop
                crop={miMaMoCrops.opening}
                locale={locale}
                width={{ base: 0.9, md: 0.92, lg: 0.9 }}
                priority
              />
            </div>
          </figure>
        </Grid>
        <Grid className={styles.facts}>
          <dl className={styles.meta}>
            <div>
              <dt className="t-label muted">{dict.project.disciplines}</dt>
              <dd>{project.disciplines.join(' · ')}</dd>
            </div>
            <div>
              <dt className="t-label muted">{copy.ui.platform}</dt>
              <dd>{copy.ui.platformValue}</dd>
            </div>
            <div>
              <dt className="t-label muted">{copy.ui.access}</dt>
              <dd>{copy.ui.accessValue}</dd>
            </div>
          </dl>
          <ChapterIndex
            label={copy.ui.chapters}
            chapters={order.map((key) => chapters[key])}
            className={styles.index}
          />
        </Grid>
      </Scene>

      {/* 01 The context: what the product is, and where each of its states is read. */}
      <Scene
        theme={worlds.miMaMo}
        atmosphere={{ light: 'none', marks: false }}
        ambient
        as="section"
        id={chapters.context.id}
        aria-labelledby="context-title"
        className={styles.context}
      >
        <Grid className={styles.contextGrid}>
          <ChapterHeading
            id="context-title"
            number={chapters.context.number}
            name={chapters.context.name}
            className={styles.contextHeading}
          >
            {copy.context.heading}
          </ChapterHeading>
          <div className={styles.contextText}>
            {copy.context.body.map((paragraph) => (
              <p key={paragraph} className="t-body-l">
                {paragraph}
              </p>
            ))}
          </div>
          <Reveal as="figure" className={styles.map}>
            <figcaption id="context-map" className={`t-label ${styles.mapLabel}`}>
              {copy.context.mapLabel}
            </figcaption>
            <div className={styles.tableWrap}>
              <table className={styles.table} aria-labelledby="context-map">
                <thead>
                  <tr>
                    <td />
                    {surfaces.map((surface) => (
                      <th key={surface} scope="col" className={`t-micro ${styles.surface}`}>
                        <span>{views[surface]}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {map.map(([state, on]) => (
                    <tr key={state}>
                      <th scope="row" className={`t-body ${styles.state}`}>
                        {copy.context.states[state]}
                      </th>
                      {surfaces.map((surface) => {
                        const read = on.includes(surface)
                        return (
                          <td key={surface} className={styles.cell} data-on={read ? '' : undefined}>
                            <span className={styles.dot} aria-hidden="true" />
                            {read ? (
                              <span className="visually-hidden">{views[surface]}</span>
                            ) : null}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <span className={styles.sweep} aria-hidden="true" data-loop="" />
            </div>
          </Reveal>
        </Grid>
      </Scene>

      <MiMaMoPicture locale={locale} copy={copy} chapter={chapters.picture} />
      <MiMaMoWeek locale={locale} copy={copy} chapter={chapters.week} />
      <MiMaMoManagement locale={locale} copy={copy} chapter={chapters.management} />
      <MiMaMoPhone locale={locale} copy={copy} chapter={chapters.phone} />
      <MiMaMoDecisions locale={locale} copy={copy} views={views} chapter={chapters.decisions} />
      <MiMaMoDetails locale={locale} copy={copy} chapter={chapters.details} />

      {/* 08 Result: only what is objectively true. Four views on one line, one system. */}
      <Scene
        theme={worlds.miMaMo}
        atmosphere={{ light: 'pool', marks: true }}
        as="section"
        id={chapters.result.id}
        aria-labelledby="result-title"
        className={styles.result}
      >
        <Grid className={styles.resultGrid}>
          <ChapterHeading
            id="result-title"
            number={chapters.result.number}
            name={chapters.result.name}
            className={styles.resultHeading}
          >
            {copy.result.heading}
          </ChapterHeading>
          <p className={`t-body-l ${styles.resultBody}`}>{copy.result.body}</p>
          <div className={styles.system}>
            <span className={styles.systemLine} aria-hidden="true" />
            <ol role="list" className={styles.systemList}>
              {surfaces.map((surface, i) => (
                <li key={surface} className={styles.systemNode}>
                  <span className={styles.systemMark} aria-hidden="true" />
                  <IndexNumber value={String(i + 1).padStart(2, '0')} className="t-micro muted" />
                  <span className="t-heading-3">{views[surface]}</span>
                </li>
              ))}
            </ol>
          </div>
        </Grid>
      </Scene>

      <Closing
        dict={dict}
        kicker={copy.closing.kicker}
        allWork={copy.ui.allWork}
        allWorkHref={workHref}
      />
    </>
  )
}

/**
 * The end of the case study: midnight gives way to steel and amber to a cold technical
 * blue, the grid thins into abstraction, and the next world of the work is named without
 * being opened. Defense Systems has no route and no case study: nothing here links to it
 * or suggests one. Its approved wording, then the way back to all of the work.
 */
function Closing({
  dict,
  kicker,
  allWork,
  allWorkHref,
}: {
  dict: Dictionary
  kicker: string
  allWork: string
  allWorkHref: Route
}) {
  const passage: StyleWithVars = {
    '--from': worlds.miMaMo.colors.surface0,
    '--to': worlds.confidential.colors.surface0,
    '--thread-from': thread.miMaMo,
    '--thread-to': thread.defense,
  }
  return (
    <>
      <div className={styles.passage} style={passage} aria-hidden="true">
        <GridLines className={styles.passageGrid} />
        <span className={styles.descent} />
      </div>
      <Scene
        theme={worlds.confidential}
        as="section"
        aria-labelledby="closing-title"
        className={styles.closing}
      >
        <Grid className={styles.closingGrid}>
          <Thread from={thread.miMaMo} to={thread.defense} />
          <p className={`t-label muted ${styles.closingKicker}`}>{kicker}</p>
          <h2 id="closing-title" className={`t-heading-1 ${styles.closingTitle}`}>
            {dict.work.confidentialTitle}
          </h2>
          <p className={`t-body-l muted ${styles.closingNote}`}>{dict.work.confidentialNote}</p>
          <Link href={allWorkHref} className={`t-action ${styles.closingBack}`}>
            <Arrow className={styles.backArrow} />
            {allWork}
          </Link>
        </Grid>
      </Scene>
    </>
  )
}
