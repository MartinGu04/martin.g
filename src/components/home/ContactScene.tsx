import type { HomeCopy } from '@/i18n/dictionaries/home'
import { Wordmark } from '@/components/brand/BrandMark'
import { Grid } from '@/components/layout/Grid'
import { Reveal } from '@/components/motion/Reveal'
import { Scene } from '@/components/scene/Scene'
import { worlds } from '@/content/worlds'
import styles from './ContactScene.module.css'

/**
 * Final scene: the ending echoes the arrival. The MARTIN.G world in its lighter graphite
 * (strong, not pitch-black), the wordmark again, a confident call to action set calmer
 * than the statement, the atmosphere quieting. The action itself (the
 * contact flow) arrives with Phase 6; until its destination exists no control is
 * rendered, so there is never a dead link.
 */
export function ContactScene({ copy }: { copy: HomeCopy['contact'] }) {
  return (
    <Scene
      theme={worlds.graphite}
      size="frame"
      atmosphere={{ light: 'shaft', grid: 'hidden', texture: 'grain', vignette: true }}
      aria-labelledby="contact-title"
      className={styles.scene}
    >
      <Grid className={styles.grid}>
        <div className={styles.mark} aria-hidden="true">
          <Wordmark decorative width="100%" />
        </div>
        <Reveal as="h2" variant="mask" id="contact-title" className={`t-heading-1 ${styles.title}`}>
          {copy.title}
        </Reveal>
        <p className={`t-heading-2 ${styles.line}`}>{copy.line}</p>
      </Grid>
    </Scene>
  )
}
