import type { Locale } from '@/i18n/config'
import type { HomeCopy } from '@/i18n/dictionaries/home'
import { aboutPortrait } from '@/content/about'
import { Grid } from '@/components/layout/Grid'
import { Eyebrow } from '@/components/type/Eyebrow'
import { Ltr } from '@/components/type/Ltr'
import { MediaFrame } from '@/components/media/MediaFrame'
import { Reveal } from '@/components/motion/Reveal'
import { Scene } from '@/components/scene/Scene'
import { Thread } from '@/components/scene/Thread'
import { thread, worlds } from '@/content/worlds'
import styles from './AboutScene.module.css'

/**
 * Scene 08, About: the person behind the system. Warmer and calmer than everything
 * before it: the warm register (lamplight on dark wood), no drawn grid, more air. It reads
 * in one pass on a clear grid: the name, the role, the portrait as a large print, and one
 * authored statement (the quote, then the sentence that grounds it). Not a biography.
 */
export function AboutScene({ copy, locale }: { copy: HomeCopy['about']; locale: Locale }) {
  return (
    <Scene theme={worlds.warm} aria-labelledby="about-title" className={styles.scene}>
      <Grid className={styles.grid}>
        <Thread from={thread.capabilities} to={thread.about} />
        <Eyebrow as="h2" id="about-title" muted={false} className={styles.eyebrow}>
          {copy.title}
        </Eyebrow>
        <div className={styles.identity}>
          <Reveal as="p" variant="mask" className={`t-heading-1 ${styles.name}`}>
            <Ltr>{copy.name}</Ltr>
          </Reveal>
          <p className={`t-statement muted ${styles.role}`}>{copy.role}</p>
        </div>
        <Reveal variant="mask" className={styles.portrait}>
          <MediaFrame
            media={aboutPortrait}
            locale={locale}
            sizes="(width >= 75rem) 36vw, (width >= 48rem) 44vw, 90vw"
          />
        </Reveal>
        <div className={styles.statement}>
          <Reveal as="p" className={`t-heading-2 ${styles.quote}`}>
            {copy.quote}
          </Reveal>
          <Reveal as="p" order={1} className={`t-body-l muted ${styles.support}`}>
            {copy.support}
          </Reveal>
        </div>
      </Grid>
    </Scene>
  )
}
