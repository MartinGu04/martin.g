import Image from 'next/image'
import Link from 'next/link'
import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import type { ShowcaseCopy } from '@/i18n/dictionaries/showcase'
import type { PublicProjectSummary } from '@/content/resolve'
import { onMedia } from '@/content/projects/on'
import { thread, worlds } from '@/content/worlds'
import type { StyleWithVars } from '@/lib/css'
import { Grid } from '@/components/layout/Grid'
import { IndexNumber } from '@/components/type/IndexNumber'
import { MediaFrame } from '@/components/media/MediaFrame'
import { ViewCycle } from '@/components/media/ViewCycle'
import { Reveal } from '@/components/motion/Reveal'
import { Scene } from '@/components/scene/Scene'
import { Thread } from '@/components/scene/Thread'
import { LiveSiteLink } from './LiveSiteLink'
import { ExploreFrame } from './ExploreFrame'
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
 * Scene 03: ON, the human, brand and experience side of the work. Quiet luxury, editorial
 * hospitality: the cream world opens softly (a gentle wipe) and the thread arrives in ON's
 * gold. The proof is the digital work, launched like a product: one large frame of the live
 * website on a bordeaux mat, turning between two of its real views, with its phone layout
 * standing in front as a real object on its own contact shadow. The retreat's own garden is
 * the only photographic atmosphere, behind the frame and breathing slowly while the visitor
 * stays; behind everything, a far, blurred crop of the same place and faint bordeaux,
 * olive and gold light give the cream depth. The title is the real ON monogram.
 */
export function OnWorld({ project, dict, showcase, locale }: OnWorldProps) {
  return (
    <Scene
      theme={worlds.on}
      enter="wipe"
      size="frame"
      ambient
      as="article"
      id="on"
      aria-labelledby="on-title"
      className={styles.scene}
    >
      {/* The world's air: a far, heavily blurred crop of the retreat and faint warm light.
          Decorative, noticed only after a moment, never competing with the work. */}
      <div
        className={styles.ambience}
        style={{ '--gold': thread.on } as StyleWithVars}
        aria-hidden="true"
      >
        <Image src={onMedia.venue.src} alt="" sizes="20vw" className={styles.haze} />
      </div>
      <Grid className={styles.grid}>
        <Thread from={thread.bridge} to={thread.on} />
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
            <p className="t-statement">{project.summary}</p>
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
        <div className={styles.gallery} style={{ '--gold': thread.on } as StyleWithVars}>
          <div className={styles.atmosphere} data-parallax>
            <MediaFrame
              media={onMedia.stage}
              locale={locale}
              motion="drift"
              sizes="(width >= 75rem) 30vw, (width >= 48rem) 50vw, 100vw"
            />
          </div>
          <div className={styles.proof}>
            <ExploreFrame href={project.href} label={showcase.explore}>
              <div className={styles.develop}>
                <ViewCycle
                  items={[{ media: onMedia.site }, { media: onMedia.siteStoryPrint }]}
                  locale={locale}
                  step={7}
                  fallback="first"
                  sizes="(width >= 75rem) 56vw, (width >= 48rem) 86vw, 76vw"
                  className={styles.print}
                />
              </div>
            </ExploreFrame>
          </div>
          <div className={styles.phone}>
            <MediaFrame media={onMedia.siteMobile} locale={locale} sizes="10rem" />
          </div>
        </div>
      </Grid>
    </Scene>
  )
}
