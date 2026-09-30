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
import { DepthType } from '@/components/scene/DepthType'
import { ProjectLink } from './ProjectLink'
import styles from './OnWorld.module.css'

type Project = PublicProjectSummary & { number: string }

/** A warm exposure standing in for photography until the real assets arrive (Phase 4). */
function PendingPhotograph({ ratio }: { ratio: number }) {
  return (
    <MediaShell aspectRatio={ratio}>
      <span className={styles.exposure} aria-hidden="true" />
    </MediaShell>
  )
}

/**
 * Scene 04: ON takes over the whole experience. The cream world wipes in from a framed
 * panel to full bleed; the title becomes dominant in bordeaux; a bordeaux register
 * follows; then the world hands the frame back by closing to a panel, with the MARTIN.G
 * black returning around it (exit wipe).
 */
export function OnWorld({ project, dict }: { project: Project; dict: Dictionary }) {
  return (
    <article aria-labelledby="on-title" className={styles.world}>
      <Scene theme={worlds.on} enter="wipe" size="frame" as="div">
        <Grid className={styles.grid}>
          <p className={`t-label ${styles.eyebrow}`}>
            <IndexNumber value={project.number} />
            <span aria-hidden="true"> / </span>
            {project.disciplines.join(' · ')}
          </p>
          <h3 id="on-title" className={`t-hero ${styles.title}`}>
            <Link href={project.href} className={styles.titleLink}>
              <Ltr>{project.title}</Ltr>
            </Link>
          </h3>
          <Reveal className={styles.text}>
            <p className="t-heading-2">{project.summary}</p>
            <ProjectLink href={project.href} label={dict.work.viewProject} title={project.title} />
          </Reveal>
          <div className={styles.portrait} data-parallax>
            <PendingPhotograph ratio={4 / 5} />
          </div>
        </Grid>
      </Scene>

      <Scene theme={worlds.onBordeaux} enter="wipe" exit="wipe" size="frame" as="div">
        <DepthType variant="line">
          <Ltr>{project.title}</Ltr>
        </DepthType>
        <Grid>
          <div className={styles.wide}>
            <PendingPhotograph ratio={16 / 9} />
          </div>
        </Grid>
      </Scene>
    </article>
  )
}
