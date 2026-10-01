import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import type { ShowcaseCopy } from '@/i18n/dictionaries/showcase'
import type { PublicProjectSummary } from '@/content/resolve'
import { miMaMoMedia } from '@/content/projects/mi-ma-mo'
import { worlds } from '@/content/worlds'
import { Grid } from '@/components/layout/Grid'
import { IndexNumber } from '@/components/type/IndexNumber'
import { Name } from '@/components/type/Name'
import { MediaFrame } from '@/components/media/MediaFrame'
import { Reveal } from '@/components/motion/Reveal'
import { Scene } from '@/components/scene/Scene'
import { ProjectLink } from './ProjectLink'
import styles from './MiMaMoWorld.module.css'

type Project = PublicProjectSummary & { number: string }

interface MiMaMoWorldProps {
  project: Project
  dict: Dictionary
  showcase: ShowcaseCopy
  locale: Locale
}

/** A technical annotation under a product view: its index and its name. */
function ViewLabel({ index, children }: { index: string; children: ReactNode }) {
  return (
    <figcaption className={`t-micro ${styles.label}`}>
      <IndexNumber value={index} />
      <span className={styles.labelRule} aria-hidden="true" />
      {children}
    </figcaption>
  )
}

/**
 * Scene 04: המחלבה (id `mi-ma-mo`), radically different from ON. A darker, cooler,
 * structured world opens from a center seam while its grid draws in. The product itself is
 * the imagery, treated like product photography: the home screen large, at a scale where
 * it reads; one phone; a cropped detail of Team Week. Every screen is real and sanitized in
 * its pixels (src/content/projects/mi-ma-mo.ts). As the world leaves, its grid and dots
 * fade, the accent drains out and it contracts back into the seam.
 */
export function MiMaMoWorld({ project, dict, showcase, locale }: MiMaMoWorldProps) {
  const views = showcase.miMaMo.views
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
            <Name>{project.title}</Name>
          </Link>
        </h3>
        <Reveal className={styles.text}>
          <p className="t-lead">{project.summary}</p>
          <ProjectLink href={project.href} label={dict.work.viewProject} title={project.title} />
          <p className={`t-micro muted ${styles.note}`}>{showcase.miMaMo.sanitized}</p>
        </Reveal>

        <Reveal as="figure" variant="mask" className={styles.dashboard}>
          <MediaFrame
            media={miMaMoMedia.dashboard}
            locale={locale}
            sizes="(width >= 75rem) 62vw, 100vw"
          />
          <ViewLabel index="01">{views.home}</ViewLabel>
        </Reveal>

        <Reveal as="figure" order={1} className={styles.detail}>
          <MediaFrame
            media={miMaMoMedia.teamWeek}
            locale={locale}
            sizes="(width >= 75rem) 30vw, (width >= 48rem) 60vw, 100vw"
          />
          <ViewLabel index="02">{views.teamWeek}</ViewLabel>
        </Reveal>

        <Reveal as="figure" order={2} className={styles.phone}>
          <MediaFrame
            media={miMaMoMedia.mobile}
            locale={locale}
            sizes="(width >= 75rem) 16vw, (width >= 48rem) 30vw, 64vw"
          />
          <ViewLabel index="03">{views.mobile}</ViewLabel>
        </Reveal>
      </Grid>
    </Scene>
  )
}
