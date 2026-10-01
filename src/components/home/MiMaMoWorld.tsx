import Link from 'next/link'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import type { ShowcaseCopy } from '@/i18n/dictionaries/showcase'
import type { PublicProjectSummary } from '@/content/resolve'
import { miMaMoMedia } from '@/content/projects/mi-ma-mo'
import { thread, worlds } from '@/content/worlds'
import { Grid } from '@/components/layout/Grid'
import { IndexNumber } from '@/components/type/IndexNumber'
import { Name } from '@/components/type/Name'
import { MediaFrame } from '@/components/media/MediaFrame'
import { ViewCycle } from '@/components/media/ViewCycle'
import { Reveal } from '@/components/motion/Reveal'
import { Scene } from '@/components/scene/Scene'
import { Thread } from '@/components/scene/Thread'
import { ProjectLink } from './ProjectLink'
import styles from './MiMaMoWorld.module.css'

type Project = PublicProjectSummary & { number: string }

interface MiMaMoWorldProps {
  project: Project
  dict: Dictionary
  showcase: ShowcaseCopy
  locale: Locale
}

/**
 * Scene 04: המחלבה (id `mi-ma-mo`), radically different from ON. A midnight, structured
 * world opens from a center seam while its grid draws in, the thread arrives in amber and
 * the product screen opens from the same seam. The product carries the scene: one frame
 * across most of the page in which three real views take turns while the visitor stays
 * (home, Team Week, the manager area), labelled like technical annotations, and a phone
 * at a readable size standing over its quiet corner. Every screen is real
 * and sanitized in its pixels (src/content/projects/mi-ma-mo.ts). As the world leaves, its
 * grid and dots fade, the accent drains and it contracts back into the seam.
 */
export function MiMaMoWorld({ project, dict, showcase, locale }: MiMaMoWorldProps) {
  const views = showcase.miMaMo.views
  return (
    <Scene
      theme={worlds.miMaMo}
      enter="split"
      exit="split"
      size="frame"
      ambient
      as="article"
      id="mi-ma-mo"
      aria-labelledby="mi-ma-mo-title"
      className={styles.scene}
    >
      <Grid className={styles.grid}>
        <Thread from={thread.on} to={thread.miMaMo} />
        <p className={`t-label ${styles.eyebrow}`}>
          <IndexNumber value={project.number} />
          <span aria-hidden="true"> / </span>
          {project.disciplines.join(' · ')}
        </p>
        <h3 id="mi-ma-mo-title" className={`t-display ${styles.title}`}>
          <Link href={project.href} className={styles.titleLink}>
            <Name>{project.title}</Name>
          </Link>
        </h3>
        <Reveal className={styles.text}>
          <p className="t-statement">{project.summary}</p>
          <ProjectLink href={project.href} label={dict.work.viewProject} title={project.title} />
          <p className={`t-small muted ${styles.note}`}>{showcase.miMaMo.sanitized}</p>
        </Reveal>

        <div className={styles.stage}>
          <ViewCycle
            items={[
              { media: miMaMoMedia.dashboard, label: views.home },
              { media: miMaMoMedia.teamWeekView, label: views.teamWeek },
              { media: miMaMoMedia.managerView, label: views.manager },
            ]}
            locale={locale}
            step={5}
            fallback="grid"
            labels
            sizes="(width >= 75rem) 80vw, 100vw"
          />
        </div>

        <figure className={styles.phone}>
          <MediaFrame
            media={miMaMoMedia.mobile}
            locale={locale}
            sizes="(width >= 75rem) 22vw, (width >= 48rem) 34vw, 75vw"
          />
          <figcaption className={`t-label ${styles.label}`}>
            <span className={styles.labelRule} aria-hidden="true" />
            {views.mobile}
          </figcaption>
        </figure>

        <figure className={styles.detail}>
          <MediaFrame media={miMaMoMedia.teamWeekNarrow} locale={locale} sizes="100vw" />
          <figcaption className={`t-label ${styles.label}`}>
            <span className={styles.labelRule} aria-hidden="true" />
            {views.teamWeek}
          </figcaption>
        </figure>
      </Grid>
    </Scene>
  )
}
