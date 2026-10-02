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
 * Scene 08, About: a portrait of the builder. The warm register (lamplight on dark wood),
 * on a clear grid read in one pass: the portrait as a large print in a lamplight mat;
 * beside it the name (deliberately quieter than the quote) and the role, the authored
 * statement as the anchor, and the three disciplines it names (strategy, design,
 * engineering) as nodes on one line that joins them. Not a biography.
 */
export function AboutScene({
  copy,
  marks,
  locale,
}: {
  copy: HomeCopy['about']
  /** Strategy, design, engineering: the three disciplines of the support line. */
  marks: readonly [string, string, string]
  locale: Locale
}) {
  return (
    <Scene theme={worlds.warm} id="about" aria-labelledby="about-title" className={styles.scene}>
      <Grid className={styles.grid}>
        <Thread from={thread.capabilities} to={thread.about} />
        <Eyebrow as="h2" id="about-title" muted={false} className={styles.eyebrow}>
          {copy.title}
        </Eyebrow>
        <div className={styles.portrait}>
          <Reveal variant="mask">
            <MediaFrame
              media={aboutPortrait}
              locale={locale}
              sizes="(width >= 75rem) 36vw, (width >= 48rem) 44vw, 90vw"
            />
          </Reveal>
        </div>
        <div className={styles.column}>
          <div className={styles.identity}>
            <Reveal as="p" variant="mask" className={`t-heading-3 ${styles.name}`}>
              <Ltr>{copy.name}</Ltr>
            </Reveal>
            <p className={`t-statement ${styles.role}`}>{copy.role}</p>
          </div>
          <div className={styles.statement}>
            <Reveal as="p" className={`t-heading-2 ${styles.quote}`}>
              {copy.quote}
            </Reveal>
            <Reveal as="p" order={1} className={`t-body-l muted ${styles.support}`}>
              {copy.support}
            </Reveal>
          </div>
          <ol role="list" className={styles.marks}>
            {marks.map((mark) => (
              <li key={mark} className={`t-label ${styles.mark}`}>
                <span className={styles.node} aria-hidden="true" />
                {mark}
              </li>
            ))}
          </ol>
        </div>
      </Grid>
    </Scene>
  )
}
