import type { Dictionary } from '@/i18n/dictionaries'
import type { HomeCopy } from '@/i18n/dictionaries/home'
import { Wordmark } from '@/components/brand/BrandMark'
import { Grid } from '@/components/layout/Grid'
import { Reveal } from '@/components/motion/Reveal'
import { Scene } from '@/components/scene/Scene'
import { DepthType } from '@/components/scene/DepthType'
import styles from './ContactScene.module.css'

/**
 * Final scene: the ending echoes the arrival. The MARTIN.G world, the wordmark again, a
 * large and confident call to action, the atmosphere quieting. The action itself (the
 * contact flow) arrives with Phase 6; until its destination exists no control is
 * rendered, so there is never a dead link.
 */
export function ContactScene({ dict, copy }: { dict: Dictionary; copy: HomeCopy['contact'] }) {
  return (
    <Scene
      size="frame"
      atmosphere={{ light: 'shaft', grid: 'hidden', texture: 'grain', vignette: true }}
      aria-labelledby="contact-title"
      className={styles.scene}
    >
      <DepthType variant="line">{dict.site.principle}</DepthType>
      <Grid className={styles.grid}>
        <div className={styles.mark} aria-hidden="true">
          <Wordmark decorative width="100%" />
        </div>
        <Reveal
          as="h2"
          variant="mask"
          id="contact-title"
          className={`t-display-xl ${styles.title}`}
        >
          {copy.title}
        </Reveal>
        <p className={`t-heading-2 ${styles.line}`}>{copy.line}</p>
      </Grid>
    </Scene>
  )
}
