import Image from 'next/image'
import Link from 'next/link'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import type { ShowcaseCopy } from '@/i18n/dictionaries/showcase'
import type { PublicProjectSummary } from '@/content/resolve'
import { onMedia } from '@/content/projects/on'
import { worlds } from '@/content/worlds'
import { Grid } from '@/components/layout/Grid'
import { IndexNumber } from '@/components/type/IndexNumber'
import { MediaFrame } from '@/components/media/MediaFrame'
import { Reveal } from '@/components/motion/Reveal'
import { Scene } from '@/components/scene/Scene'
import { LiveSiteLink } from './LiveSiteLink'
import { ProjectLink } from './ProjectLink'
import styles from './OnWorld.module.css'

type Project = PublicProjectSummary & { number: string }

interface OnWorldProps {
  project: Project
  dict: Dictionary
  showcase: ShowcaseCopy
  locale: Locale
}

/**
 * Scene 03: ON. The impact is the change of mood, not scale: quiet luxury, editorial
 * hospitality. The cream world opens softly (a short, gentle wipe). The title is the real
 * ON monogram, set at display size. Real material carries the scene: one dominant
 * photograph from the retreat's route, and the live website as a print on a bordeaux mat
 * (on phones, the same opening screen as it appears on a phone). Olive is the detail.
 */
export function OnWorld({ project, dict, showcase, locale }: OnWorldProps) {
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
          <h3 id="on-title" className={styles.title}>
            <Link href={project.href} className={styles.titleLink}>
              <Image
                src={onMedia.mark.src}
                alt={project.title}
                sizes="(width >= 75rem) 14rem, 10rem"
                className={styles.mark}
              />
            </Link>
          </h3>
          <span className={styles.rule} aria-hidden="true" />
          <Reveal className={styles.summary}>
            <p className="t-heading-3">{project.summary}</p>
            <div className={styles.actions}>
              <ProjectLink
                href={project.href}
                label={dict.work.viewProject}
                title={project.title}
              />
              {project.liveHref ? (
                <LiveSiteLink
                  href={project.liveHref}
                  label={dict.work.visitLiveSite}
                  title={project.title}
                  newTab={showcase.opensInNewTab}
                />
              ) : null}
            </div>
          </Reveal>
        </div>
        <div className={styles.gallery}>
          <div className={styles.photoMain} data-parallax>
            <MediaFrame
              media={onMedia.patisserie}
              locale={locale}
              sizes="(width >= 75rem) 36vw, (width >= 48rem) 70vw, 100vw"
            />
          </div>
          <div className={styles.photoSecond} data-parallax>
            <MediaFrame
              media={onMedia.site}
              locale={locale}
              sizes="(width >= 75rem) 30vw, (width >= 48rem) 56vw, 50vw"
            />
          </div>
        </div>
      </Grid>
    </Scene>
  )
}
