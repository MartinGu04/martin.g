import Link from 'next/link'
import type { Dictionary } from '@/i18n/dictionaries'
import type { PublicProjectSummary } from '@/content/resolve'
import { worlds } from '@/content/worlds'
import { Grid } from '@/components/layout/Grid'
import { IndexNumber } from '@/components/type/IndexNumber'
import { Ltr } from '@/components/type/Ltr'
import { Reveal } from '@/components/motion/Reveal'
import { Scene } from '@/components/scene/Scene'
import { OpsBoard } from './OpsBoard'
import { ProjectLink } from './ProjectLink'
import styles from './MiMaMoWorld.module.css'

type Project = PublicProjectSummary & { number: string }

/**
 * Scene 05: mi-ma-mo, radically different from ON. A darker, cooler, structured world
 * opens from a center seam while its grid draws in; operational fragments fill along a
 * time axis. As it leaves, the grid and dots fade, the accent drains out and the world
 * contracts back into the seam, near-monochrome, ready for the restrained scene after it.
 */
export function MiMaMoWorld({ project, dict }: { project: Project; dict: Dictionary }) {
  return (
    <Scene
      theme={worlds.miMaMo}
      enter="split"
      exit="split"
      size="frame"
      as="article"
      id="mi-ma-mo"
      aria-labelledby="mi-ma-mo-title"
      className={styles.scene}
    >
      <Grid className={styles.grid}>
        <p className={`t-label ${styles.eyebrow}`}>
          <IndexNumber value={project.number} />
          <span aria-hidden="true"> / </span>
          {project.disciplines.join(' · ')}
        </p>
        <h3 id="mi-ma-mo-title" className={`t-display-xl ${styles.title}`}>
          <Link href={project.href} className={styles.titleLink}>
            <Ltr>{project.title}</Ltr>
          </Link>
        </h3>
        <Reveal className={styles.text}>
          <p className="t-lead">{project.summary}</p>
          <ProjectLink href={project.href} label={dict.work.viewProject} title={project.title} />
        </Reveal>
        <OpsBoard className={styles.board} />
      </Grid>
    </Scene>
  )
}
