import type { Dictionary } from '@/i18n/dictionaries'
import { Wordmark } from '@/components/brand/BrandMark'
import { Grid } from '@/components/layout/Grid'
import { Scene } from '@/components/scene/Scene'
import { Atmosphere } from '@/components/scene/Atmosphere'
import { DepthType } from '@/components/scene/DepthType'
import styles from './HeroStage.module.css'

/**
 * Scenes 01 and 02: arrival, then the statement. A tall stage with a sticky frame: while
 * the visitor scrolls through it (natural scroll, never hijacked), a CSS view timeline
 * moves the wordmark from a centered arrival to its resting place, mask-reveals the
 * monumental statement, shifts the light and the cropped depth type, and finally lets the
 * statement recede as the frame releases.
 *
 * Without scroll-driven animation support, with reduced motion, or in a short viewport
 * (for example at 200% zoom) the same markup is the static hero frame: everything
 * visible, nothing sticky. The h1 is real text and is never hidden.
 */
export function HeroStage({ dict }: { dict: Dictionary }) {
  return (
    <Scene atmosphere={false} aria-labelledby="hero-title" className={styles.stage}>
      <div className={styles.frame}>
        <Atmosphere
          light="shaft"
          grid="light"
          texture="grain"
          marks
          className={styles.atmosphere}
        />
        <DepthType variant="line" className={styles.depth}>
          {dict.site.principle}
        </DepthType>
        <Grid className={styles.grid}>
          <h1 id="hero-title" className={styles.title}>
            <span className="visually-hidden">{dict.site.name}</span>
            <span className={styles.mark}>
              <Wordmark decorative width="100%" />
            </span>
          </h1>
          <p className={`t-hero ${styles.statement}`}>{dict.site.principle}</p>
          <p className={`t-micro muted ${styles.cue}`} aria-hidden="true">
            <span className={styles.cueLine} />
            {dict.a11y.scrollHint}
          </p>
        </Grid>
      </div>
    </Scene>
  )
}
