import Link from 'next/link'
import type { Dictionary } from '@/i18n/dictionaries'
import type { PublicProjectSummary } from '@/content/resolve'
import { worlds } from '@/content/worlds'
import { Grid } from '@/components/layout/Grid'
import { IndexNumber } from '@/components/type/IndexNumber'
import { Ltr } from '@/components/type/Ltr'
import { MediaShell } from '@/components/media/MediaShell'
import { Reveal } from '@/components/motion/Reveal'
import { Scene } from '@/components/scene/Scene'
import { ProjectLink } from './ProjectLink'
import styles from './OnWorld.module.css'

type Project = PublicProjectSummary & { number: string }

/** A warm exposure standing in for photography until the real assets arrive (Phase 4). */
function PendingPhotograph({ ratio, tone }: { ratio: number; tone: 'wine' | 'olive' }) {
  return (
    <MediaShell aspectRatio={ratio}>
      <span className={`${styles.exposure} ${styles[tone]}`} aria-hidden="true" />
    </MediaShell>
  )
}

/**
 * Scene 04: ON. The impact is the change of mood, not scale: quiet luxury, editorial
 * hospitality. The cream world opens softly (a short, gentle wipe); the title is
 * confident but modest; photography carries the scene; bordeaux is an accent (a mat
 * behind one print), olive the detail.
 */
export function OnWorld({ project, dict }: { project: Project; dict: Dictionary }) {
  return (
    <Scene
      theme={worlds.on}
      enter="wipe"
      size="frame"
      as="article"
      id="on"
      aria-labelledby="on-title"
      className={styles.scene}
    >
      <Grid className={styles.grid}>
        <div className={styles.text}>
          <p className={`t-label ${styles.eyebrow}`}>
            <IndexNumber value={project.number} />
            <span aria-hidden="true"> / </span>
            {project.disciplines.join(' · ')}
          </p>
          <h3 id="on-title" className={`t-display ${styles.title}`}>
            <Link href={project.href} className={styles.titleLink}>
              <Ltr>{project.title}</Ltr>
            </Link>
          </h3>
          <span className={styles.rule} aria-hidden="true" />
          <Reveal className={styles.summary}>
            <p className="t-heading-3">{project.summary}</p>
            <ProjectLink href={project.href} label={dict.work.viewProject} title={project.title} />
          </Reveal>
        </div>
        <div className={styles.gallery} aria-hidden="true">
          <div className={styles.photoMain} data-parallax>
            <PendingPhotograph ratio={4 / 5} tone="wine" />
          </div>
          <div className={styles.photoSecond} data-parallax>
            <PendingPhotograph ratio={3 / 2} tone="olive" />
          </div>
        </div>
      </Grid>
    </Scene>
  )
}
