import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import type { ShowcaseCopy } from '@/i18n/dictionaries/showcase'
import { mediaCopy } from '@/i18n/dictionaries/showcase'
import type { OnCaseCopy, OnChapterKey } from '@/i18n/dictionaries/case-on'
import type { PublicProjectSummary } from '@/content/resolve'
import { onCrops, onMedia } from '@/content/projects/on'
import { miMaMoMedia } from '@/content/projects/mi-ma-mo'
import { thread, worlds } from '@/content/worlds'
import { Grid } from '@/components/layout/Grid'
import { Arrow } from '@/components/type/Arrow'
import { IndexNumber } from '@/components/type/IndexNumber'
import { Ltr } from '@/components/type/Ltr'
import { MediaFrame } from '@/components/media/MediaFrame'
import { Reveal } from '@/components/motion/Reveal'
import { Scene } from '@/components/scene/Scene'
import { LiveSiteLink } from '@/components/home/LiveSiteLink'
import { ChapterHeading } from '../Chapter'
import { ChapterIndex, type ChapterLink } from '../ChapterIndex'
import { Crop } from '../Crop'
import { NextProject } from '../NextProject'
import { ReadingProgress } from '../ReadingProgress'
import { OnDirection } from './OnDirection'
import { OnWebsite } from './OnWebsite'
import { OnDecisions } from './OnDecisions'
import { OnDetails } from './OnDetails'
import styles from './OnCaseStudy.module.css'

type Summary = PublicProjectSummary & { number: string }

export interface OnCaseStudyProps {
  locale: Locale
  dict: Dictionary
  showcase: ShowcaseCopy
  copy: OnCaseCopy
  project: Summary
  next: Summary
}

/** Chapter order is the narrative: why, what could go wrong, how it looks, how it works. */
const order = [
  'context',
  'problem',
  'direction',
  'website',
  'decisions',
  'film',
  'details',
  'result',
] as const satisfies readonly OnChapterKey[]

export type OnChapters = Readonly<Record<OnChapterKey, ChapterLink>>

/**
 * The ON case study (Phase 5A): how the brand and the website were thought through,
 * decided and built, told with the real material only. It enters deeper into ON's own
 * world than the homepage does and moves through its registers chapter by chapter:
 *
 *   opening        wine          the monogram, the promise, the live site rising
 *   context        cream         the retreat and its format, the guesthouse garden
 *   problem        cream         everything it must not be
 *   direction      cream         an editorial brand book: mark, palette, type, photo, arch
 *   website        wine          the identity working: structure, rhythm, the phone
 *   decisions      cream         six real decisions, each with its evidence
 *   film           night         the watermarked preview in a screening room (wipe)
 *   details        cream         craft, up close
 *   result         wine          what is objectively true, and the live site
 *   next           המחלבה        the wine darkens into midnight, the grid surfaces (split)
 *
 * Exploration stays native and light: a chapter index, numbered chapter markers and a
 * reading hairline along the header. Nothing locks the scroll.
 */
export function OnCaseStudy({ locale, dict, showcase, copy, project, next }: OnCaseStudyProps) {
  const chapters = Object.fromEntries(
    order.map((key, i) => [
      key,
      { id: key, number: String(i + 1).padStart(2, '0'), name: copy.chapters[key] },
    ]),
  ) as unknown as OnChapters
  const workHref = `/${locale}#work` as Route
  const live = project.liveHref

  return (
    <>
      <ReadingProgress color={thread.on} />

      {/* Opening: ON's identity first, then the real thing rising into the frame. */}
      <Scene
        theme={worlds.onBordeaux}
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
            <p className={`t-label ${styles.kicker}`}>
              {copy.ui.caseStudy}
              <span aria-hidden="true"> / </span>
              <IndexNumber value={project.number} />
            </p>
          </div>
          <div className={styles.identity}>
            <h1 id="case-title" className={styles.title}>
              <Image
                src={onMedia.mark.src}
                alt={project.title}
                sizes="(width >= 75rem) 18rem, 12rem"
                loading="eager"
                className={styles.mark}
              />
            </h1>
            <p className={`t-label ${styles.line}`}>{showcase.chapters.onIdentity}</p>
            <p className={`t-statement ${styles.statement}`}>{copy.opening.statement}</p>
          </div>
        </Grid>
        <div className={styles.rise}>
          <Grid>
            <Crop
              crop={onCrops.siteHome}
              locale={locale}
              width={{ base: 0.9, md: 0.92, lg: 0.75 }}
              priority
              className={styles.screen}
            />
          </Grid>
        </div>
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
              <dt className="t-label muted">{copy.ui.status}</dt>
              <dd>{copy.ui.statusValue}</dd>
            </div>
          </dl>
          {live ? (
            <LiveSiteLink
              href={live}
              label={dict.work.visitLiveSite}
              title={project.title}
              newTab={showcase.opensInNewTab}
              className={styles.live}
            />
          ) : null}
          <ChapterIndex
            label={copy.ui.chapters}
            chapters={order.map((key) => chapters[key])}
            className={styles.index}
          />
        </Grid>
      </Scene>

      {/* 01 The context: the retreat, its format, its place. */}
      <Scene
        theme={worlds.on}
        as="section"
        id="context"
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
          <Reveal className={styles.contextText}>
            {copy.context.body.map((paragraph) => (
              <p key={paragraph} className="t-body-l">
                {paragraph}
              </p>
            ))}
          </Reveal>
          <div className={styles.contextImage} data-parallax>
            <MediaFrame
              media={onMedia.venue}
              locale={locale}
              sizes="(width >= 75rem) 42vw, 100vw"
              caption={mediaCopy.onCaptions.venue[locale]}
            />
          </div>
          <div className={styles.format}>
            <p className={`t-label muted ${styles.formatLabel}`}>{copy.context.formatLabel}</p>
            <dl className={styles.formatList}>
              {copy.context.format.map((item) => (
                <div key={item.value} className={styles.formatItem}>
                  <dt className={`t-heading-2 t-numeric ${styles.formatValue}`}>
                    <Ltr>{item.value}</Ltr>
                  </dt>
                  <dd className="t-body">{item.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Grid>
      </Scene>

      {/* 02 The problem: told as what it must not become. */}
      <Scene
        theme={worlds.on}
        atmosphere={{ light: 'pool', vignette: false }}
        as="section"
        id="problem"
        aria-labelledby="problem-title"
        className={styles.problem}
      >
        <Grid className={styles.problemGrid}>
          <ChapterHeading
            id="problem-title"
            number={chapters.problem.number}
            name={chapters.problem.name}
            className={styles.problemHeading}
          >
            {copy.problem.heading}
          </ChapterHeading>
          <ul role="list" className={styles.not}>
            {copy.problem.not.map((item) => (
              <li key={item} className={`t-heading-2 ${styles.notItem}`}>
                <span className={styles.notText}>{item}</span>
              </li>
            ))}
          </ul>
          <Reveal className={styles.resolution}>
            <span className={styles.resolutionRule} aria-hidden="true" />
            <p className="t-statement">{copy.problem.resolution}</p>
          </Reveal>
        </Grid>
      </Scene>

      <OnDirection locale={locale} copy={copy.direction} chapter={chapters.direction} />
      <OnWebsite locale={locale} copy={copy.website} chapter={chapters.website} />
      <OnDecisions locale={locale} copy={copy.decisions} chapter={chapters.decisions} />

      {/* 06 Film: the watermarked preview, in a screening room. */}
      <Scene
        theme={worlds.onNight}
        enter="wipe"
        as="section"
        id="film"
        aria-labelledby="film-title"
        className={styles.film}
      >
        <Grid className={styles.filmGrid}>
          <ChapterHeading
            id="film-title"
            number={chapters.film.number}
            name={chapters.film.name}
            className={styles.filmHeading}
          >
            {copy.film.heading}
          </ChapterHeading>
          <p className={`t-body-l muted ${styles.filmLine}`}>{copy.film.line}</p>
          <div className={styles.screening}>
            <MediaFrame
              media={onMedia.film}
              locale={locale}
              sizes="(width >= 75rem) 84vw, 100vw"
              caption={`${showcase.film.title}. ${showcase.film.note}`}
              videoLabels={showcase.film}
            />
          </div>
        </Grid>
      </Scene>

      <OnDetails locale={locale} copy={copy.details} chapter={chapters.details} />

      {/* 08 Result: only what is objectively true. */}
      <Scene
        theme={worlds.onBordeaux}
        atmosphere={{ vignette: false }}
        as="section"
        id="result"
        aria-labelledby="result-title"
        className={styles.result}
      >
        <Grid className={styles.resultGrid}>
          <div className={styles.resultText}>
            <ChapterHeading
              id="result-title"
              number={chapters.result.number}
              name={chapters.result.name}
            >
              {copy.result.heading}
            </ChapterHeading>
            <p className="t-body-l">{copy.result.body}</p>
            {live ? (
              <LiveSiteLink
                href={live}
                label={dict.work.visitLiveSite}
                title={project.title}
                newTab={showcase.opensInNewTab}
                className={styles.resultLive}
              />
            ) : null}
          </div>
          <div className={styles.devices}>
            <Crop
              crop={onCrops.siteHome}
              locale={locale}
              width={{ base: 0.75, md: 0.7, lg: 0.38 }}
              className={styles.desktop}
            />
            <Crop
              crop={onCrops.siteMobile}
              locale={locale}
              width={{ base: 0.3, md: 0.2, lg: 0.12 }}
              className={styles.phone}
            />
          </div>
        </Grid>
      </Scene>

      <NextProject
        locale={locale}
        project={next}
        line={showcase.chapters.miMaMo}
        glimpse={miMaMoMedia.dashboard}
        from={{ surface: worlds.onBordeaux.colors.surface0, thread: thread.on }}
        to={{ theme: worlds.miMaMo, thread: thread.miMaMo }}
        labels={{
          next: copy.ui.next,
          viewProject: dict.work.viewProject,
          allWork: copy.ui.allWork,
        }}
        allWorkHref={workHref}
      />
    </>
  )
}
