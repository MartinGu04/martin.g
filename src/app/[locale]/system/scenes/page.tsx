import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { isLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/get-dictionary'
import { getProjectSequence } from '@/content/registry'
import { resolveConfidentialSummary, resolvePublicSummary } from '@/content/resolve'
import { confidentialWorld } from '@/content/worlds'
import { isSpecimenEnabled } from '@/lib/specimen'
import { Grid } from '@/components/layout/Grid'
import { Ltr } from '@/components/type/Ltr'
import { IndexNumber } from '@/components/type/IndexNumber'
import { Wordmark } from '@/components/brand/BrandMark'
import { MediaShell } from '@/components/media/MediaShell'
import { AbstractCover } from '@/components/project/AbstractCover'
import { Scene } from '@/components/scene/Scene'
import { DepthType } from '@/components/scene/DepthType'
import { demoWorlds } from '../world-themes'
import { scenesCopy as copy } from './scenes-copy'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Scenes',
  robots: { index: false, follow: false },
}

/** Scene label: which world and which transition (QA annotation, not design). */
function SceneNote({ children }: { children: ReactNode }) {
  return <p className={`col-full t-micro muted ${styles.note}`}>{children}</p>
}

/** A decorative photograph stand-in: warm exposure in the world's own light and accents. */
function PhotoPending({ ratio, caption }: { ratio: number; caption: string }) {
  return (
    <MediaShell aspectRatio={ratio} caption={caption}>
      <span className={styles.exposure} aria-hidden="true" />
    </MediaShell>
  )
}

/** Decorative scheduling board for the technical world: lanes, blocks, a time axis. */
function Board({ caption }: { caption: string }) {
  const hours = ['00', '04', '08', '12', '16', '20', '24']
  const lanes = [
    [
      [4, 22],
      [34, 30, 'a'],
      [70, 18],
    ],
    [
      [0, 30],
      [38, 20],
      [62, 34, 'b'],
    ],
    [
      [12, 40, 'a'],
      [58, 16],
      [80, 16],
    ],
    [
      [2, 16],
      [22, 26],
      [54, 40, 'b'],
    ],
    [
      [8, 30],
      [44, 22, 'a'],
      [72, 24],
    ],
  ] as const
  return (
    <figure className={styles.board}>
      <div className={styles.boardFrame} aria-hidden="true">
        <div className={`t-micro t-numeric ${styles.axis}`}>
          {hours.map((h) => (
            <span key={h}>
              <Ltr>{h}</Ltr>
            </span>
          ))}
        </div>
        {lanes.map((blocks, lane) => (
          <div key={lane} className={styles.lane}>
            <span className={`t-micro t-numeric ${styles.laneIndex}`}>
              <Ltr>{String(lane + 1).padStart(2, '0')}</Ltr>
            </span>
            <span className={styles.track}>
              {blocks.map(([start, size, tone], i) => (
                <i
                  key={i}
                  className={`${styles.block} ${tone ? styles[`tone_${tone}`] : ''}`}
                  style={{ insetInlineStart: `${start}%`, inlineSize: `${size}%` }}
                />
              ))}
            </span>
          </div>
        ))}
        <span className={styles.scan} />
      </div>
      <figcaption className="t-small muted">{caption}</figcaption>
    </figure>
  )
}

/**
 * Scene grammar demonstration: one MARTIN.G grammar holding several worlds, scene after
 * scene. Preview builds only (404 in production), noindex, unlinked.
 */
export default async function ScenesPage({ params }: PageProps<'/[locale]/system/scenes'>) {
  const { locale } = await params
  if (!isLocale(locale) || !isSpecimenEnabled()) notFound()
  const dict = getDictionary(locale)
  const t = (value: { en: string; he: string }) => value[locale]
  const sequence = getProjectSequence()
  const work = sequence.flatMap(({ project, number }) =>
    project.visibility === 'public'
      ? [{ number, ...resolvePublicSummary(project, locale, dict) }]
      : [],
  )
  const confidential = sequence.flatMap(({ project, number }) =>
    project.visibility === 'confidential'
      ? [{ number, ...resolveConfidentialSummary(project, locale, dict) }]
      : [],
  )
  const on = work.find((p) => p.id === 'on')!
  const miMaMo = work.find((p) => p.id === 'mi-ma-mo')!

  return (
    <>
      {/* 1. The MARTIN.G world: cinematic dark, one shaft of light, the grid only in it. */}
      <Scene
        size="frame"
        atmosphere={{ light: 'shaft', grid: 'light', texture: 'grain', marks: true }}
        aria-labelledby="scene-brand"
      >
        <DepthType variant="line">{dict.site.principle}</DepthType>
        <Grid className={styles.brand}>
          <h1 className="visually-hidden">{t(copy.title)}</h1>
          <p className="col-full t-label muted">{t(copy.note)}</p>
          <SceneNote>{t(copy.worlds.brand)}</SceneNote>
          <p className={`t-label ${styles.eyebrow}`}>
            <IndexNumber value={on.number} />
            <span aria-hidden="true"> / </span>
            {dict.work.selectedTitle}
          </p>
          <h2 id="scene-brand" className={`t-display-xl ${styles.brandTitle}`}>
            {dict.site.positioning}
          </h2>
        </Grid>
      </Scene>

      {/* 2. ON takes over: cream, bordeaux, olive, warm black, photography, paper. */}
      <Scene
        theme={demoWorlds.on}
        enter="wipe"
        size="frame"
        aria-labelledby="scene-on"
        className={styles.on}
      >
        <Grid className={styles.onGrid}>
          <SceneNote>
            {t(copy.worlds.on)} · {t(copy.transitions.wipe)}
          </SceneNote>
          <p className={`t-label ${styles.accent} ${styles.onEyebrow}`}>
            <IndexNumber value={on.number} />
            <span aria-hidden="true"> / </span>
            {dict.work.selectedTitle}
          </p>
          <h2 id="scene-on" className={`t-hero ${styles.onTitle}`}>
            <Ltr>{on.title}</Ltr>
          </h2>
          <div className={styles.onText}>
            <p className="t-heading-2">{on.summary}</p>
            <p className={`t-label ${styles.accent2}`}>{on.disciplines.join(' · ')}</p>
          </div>
          <div className={styles.onPhoto}>
            <PhotoPending ratio={4 / 5} caption={t(copy.photo)} />
          </div>
        </Grid>
      </Scene>

      {/* 2b. A second register inside the same world: bordeaux, a softer rhythm. */}
      <Scene theme={demoWorlds.onBordeaux} as="div" className={styles.onChapter}>
        <Grid>
          <div className={styles.onWide}>
            <PhotoPending ratio={16 / 9} caption={t(copy.photo)} />
          </div>
        </Grid>
      </Scene>

      {/* 3. Back to the MARTIN.G world, which introduces the next project. */}
      <Scene
        enter="wipe"
        atmosphere={{ light: 'pool', grid: 'fade', texture: 'grain' }}
        aria-labelledby="scene-return"
      >
        <DepthType variant="index">{miMaMo.number}</DepthType>
        <Grid className={styles.returnGrid}>
          <SceneNote>
            {t(copy.worlds.brand)} · {t(copy.transitions.wipe)}
          </SceneNote>
          <h2 id="scene-return" className={`col-full t-label ${styles.eyebrow}`}>
            <IndexNumber value={miMaMo.number} />
            <span aria-hidden="true"> / </span>
            {dict.work.selectedTitle}
          </h2>
          <p className="col-full t-display-xl">
            <Ltr>{miMaMo.title}</Ltr>
          </p>
        </Grid>
      </Scene>

      {/* 4. mi-ma-mo: darker, structured, technical. The grid is drawn; data is the imagery. */}
      <Scene theme={demoWorlds.miMaMo} enter="split" size="frame" aria-labelledby="scene-mimamo">
        <Grid className={styles.mmGrid}>
          <SceneNote>
            {t(copy.worlds.miMaMo)} · {t(copy.transitions.split)}
          </SceneNote>
          <p className={`t-label ${styles.accent} ${styles.mmEyebrow}`}>
            <IndexNumber value={miMaMo.number} />
            <span aria-hidden="true"> / </span>
            {dict.work.selectedTitle}
          </p>
          <h2 id="scene-mimamo" className={`t-display-xl ${styles.mmTitle}`}>
            <Ltr>{miMaMo.title}</Ltr>
          </h2>
          <div className={styles.mmText}>
            <p className="t-lead">{miMaMo.summary}</p>
            <p className="t-small muted">{miMaMo.disciplines.join(' · ')}</p>
          </div>
          <div className={styles.mmBoard}>
            <Board caption={t(copy.fragment)} />
          </div>
        </Grid>
      </Scene>

      {/* 5. Confidential: restrained, monochrome, abstract. A hard cut, no light. */}
      <Scene theme={confidentialWorld} aria-labelledby="scene-confidential">
        <Grid className={styles.confGrid}>
          <SceneNote>
            {t(copy.worlds.confidential)} · {t(copy.transitions.cut)}
          </SceneNote>
          <h2 id="scene-confidential" className={`col-full t-label ${styles.eyebrow}`}>
            {dict.work.confidentialTitle}
          </h2>
          <ul role="list" className={`col-full ${styles.confList}`}>
            {confidential.map((project) => (
              <li key={project.id} className={styles.confItem}>
                <AbstractCover pattern={project.pattern} />
                <IndexNumber value={project.number} className="t-label muted" />
                <h3 className="t-heading-2">{project.title}</h3>
                <p className="t-body muted">{project.summary}</p>
              </li>
            ))}
          </ul>
        </Grid>
      </Scene>

      {/* 6. The MARTIN.G world closes the sequence. */}
      <Scene
        enter="wipe"
        size="frame"
        atmosphere={{ light: 'shaft', grid: 'hidden', texture: 'grain' }}
        aria-labelledby="scene-close"
      >
        <Grid className={styles.close}>
          <h2 id="scene-close" className={styles.closeMark}>
            <span className="visually-hidden">{dict.site.name}</span>
            <Wordmark decorative width="100%" />
          </h2>
          <p className={`t-hero ${styles.closeLine}`}>{dict.site.principle}</p>
        </Grid>
      </Scene>
    </>
  )
}
