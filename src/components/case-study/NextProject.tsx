import Link from 'next/link'
import type { Route } from 'next'
import type { Locale } from '@/i18n/config'
import type { HexColor, ImageMedia, ProjectTheme } from '@/content/schema'
import type { PublicProjectSummary } from '@/content/resolve'
import type { StyleWithVars } from '@/lib/css'
import { Grid } from '@/components/layout/Grid'
import { GridLines } from '@/components/layout/GridLines'
import { IndexNumber } from '@/components/type/IndexNumber'
import { Name } from '@/components/type/Name'
import { Arrow } from '@/components/type/Arrow'
import { MediaFrame } from '@/components/media/MediaFrame'
import { Scene } from '@/components/scene/Scene'
import { Thread } from '@/components/scene/Thread'
import { ProjectLink } from '@/components/home/ProjectLink'
import styles from './NextProject.module.css'

interface NextProjectProps {
  locale: Locale
  project: PublicProjectSummary & { number: string }
  /** What the next world is, in one line (the Selected Work chapter line). */
  line: string
  glimpse: ImageMedia
  /** The world being left (its background and thread color) and the one arriving. */
  from: { surface: HexColor; thread: HexColor }
  to: { theme: ProjectTheme; thread: HexColor }
  labels: { next: string; viewProject: string; allWork: string }
  allWorkHref: Route
}

/**
 * The end of a case study is the way into the next world, not a "next project" footer.
 * The departing world darkens into the arriving one over a tall decorative passage in
 * which the next world's grid surfaces and the thread descends, changing color as it
 * goes; then the next world takes the frame its own way (a split from the center seam
 * for המחלבה) with its name, its line, a real glimpse and the way in. The passage is
 * static color and lines: it is the same with reduced motion, only the thread's drawing
 * is scroll-driven.
 */
export function NextProject({
  locale,
  project,
  line,
  glimpse,
  from,
  to,
  labels,
  allWorkHref,
}: NextProjectProps) {
  const passage: StyleWithVars = {
    '--from': from.surface,
    '--to': to.theme.colors.surface0,
    '--line': to.theme.colors.line ?? 'rgb(255 255 255 / 0.1)',
    '--thread-from': from.thread,
    '--thread-to': to.thread,
  }
  return (
    <>
      <div className={styles.passage} style={passage} aria-hidden="true">
        <GridLines className={styles.grid} />
        <span className={styles.descent} />
      </div>
      <Scene
        theme={to.theme}
        enter="split"
        as="section"
        id="next"
        aria-labelledby="next-title"
        className={styles.scene}
      >
        <Grid className={styles.layout}>
          <Thread from={from.thread} to={to.thread} />
          <div className={styles.text}>
            <p className={`t-label ${styles.eyebrow}`}>
              {labels.next}
              <span aria-hidden="true"> / </span>
              <IndexNumber value={project.number} />
            </p>
            <h2 id="next-title" className={`t-display ${styles.title}`}>
              <Link href={project.href} className={styles.titleLink}>
                <Name>{project.title}</Name>
              </Link>
            </h2>
            <p className={`t-label ${styles.line}`}>{line}</p>
            <p className={`t-statement ${styles.statement}`}>{project.summary}</p>
            <div className={styles.actions}>
              <ProjectLink href={project.href} label={labels.viewProject} title={project.title} />
              <Link href={allWorkHref} className={`t-action ${styles.back}`}>
                <Arrow className={styles.backArrow} />
                {labels.allWork}
              </Link>
            </div>
          </div>
          <div className={styles.glimpse}>
            <MediaFrame media={glimpse} locale={locale} sizes="(width >= 75rem) 50vw, 100vw" />
          </div>
        </Grid>
      </Scene>
    </>
  )
}
