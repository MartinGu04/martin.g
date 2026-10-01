import type { Locale } from '@/i18n/config'
import type { HomeCopy } from '@/i18n/dictionaries/home'
import { aboutPortrait } from '@/content/about'
import { Grid } from '@/components/layout/Grid'
import { Eyebrow } from '@/components/type/Eyebrow'
import { Ltr } from '@/components/type/Ltr'
import { MediaFrame } from '@/components/media/MediaFrame'
import { Reveal } from '@/components/motion/Reveal'
import { Scene } from '@/components/scene/Scene'
import { worlds } from '@/content/worlds'
import styles from './AboutScene.module.css'

/**
 * Scene 08, About: the person behind the system. Warmer and calmer than everything
 * before it: the warm register (lamplight on dark wood), no drawn grid, more air,
 * concise text, and Martin's portrait as one quiet print beside it.
 */
export function AboutScene({ copy, locale }: { copy: HomeCopy['about']; locale: Locale }) {
  return (
    <Scene theme={worlds.warm} aria-labelledby="about-title" className={styles.scene}>
      <Grid className={styles.grid}>
        <Eyebrow as="h2" id="about-title" muted={false} className="col-full">
          {copy.title}
        </Eyebrow>
        <Reveal variant="mask" className={styles.portrait}>
          <MediaFrame
            media={aboutPortrait}
            locale={locale}
            sizes="(width >= 75rem) 30vw, (width >= 48rem) 36vw, 90vw"
          />
        </Reveal>
        <Reveal as="p" variant="mask" className={`t-heading-1 ${styles.name}`}>
          <Ltr>{copy.name}</Ltr>
        </Reveal>
        <p className={`t-label muted ${styles.role}`}>{copy.role}</p>
        <div className={styles.lines}>
          {copy.lines.map((line, i) => (
            <Reveal
              as="p"
              key={line}
              order={i}
              className={i === 0 ? 't-heading-2' : 't-lead muted'}
            >
              {line}
            </Reveal>
          ))}
        </div>
      </Grid>
    </Scene>
  )
}
