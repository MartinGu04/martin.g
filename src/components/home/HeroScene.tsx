import type { Dictionary } from '@/i18n/dictionaries'
import { Wordmark } from '@/components/brand/BrandMark'
import { Grid } from '@/components/layout/Grid'
import { Ltr } from '@/components/type/Ltr'
import { Scene } from '@/components/scene/Scene'
import { DepthType } from '@/components/scene/DepthType'
import styles from './HeroScene.module.css'

interface HeroSceneProps {
  dict: Dictionary
  name: string
  role: string
}

/**
 * Scene 01: identity, proposition, principle, in one frame and within about two seconds.
 *   beat 1  the MARTIN.G wordmark, then Martin Gusin, Product Builder
 *   beat 2  Digital products, systems & experiences.
 *   beat 3  From problem to product. (the visual peak)
 * The beats are timed on arrival, not tied to scrolling, so nobody has to scroll to learn
 * whose site this is. Scrolling then moves straight on to the work. Without scripting or
 * with reduced motion everything is simply there. One ambient layer only: the key light
 * drifts very slowly across the frame, noticed after a few seconds, never demanding.
 */
export function HeroScene({ dict, name, role }: HeroSceneProps) {
  return (
    <Scene
      size="frame"
      ambient
      atmosphere={{ light: 'shaft', grid: 'light', texture: 'grain', marks: true }}
      aria-labelledby="hero-title"
      className={styles.hero}
    >
      <DepthType variant="line">{dict.site.principle}</DepthType>
      <Grid className={styles.grid}>
        <h1 id="hero-title" className={styles.title}>
          <span className="visually-hidden">{dict.site.name}</span>
          <span className={styles.mark}>
            <Wordmark decorative width="100%" />
          </span>
        </h1>
        <p className={styles.identity}>
          <span className={`t-heading-3 ${styles.name}`}>
            <Ltr>{name}</Ltr>
          </span>
          <span className="t-label muted">{role}</span>
        </p>
        <p className={`t-heading-2 ${styles.positioning}`}>{dict.site.positioning}</p>
        <p className={`t-display-xl ${styles.statement}`}>{dict.site.principle}</p>
        <p className={`t-micro muted ${styles.cue}`} aria-hidden="true">
          <span className={styles.cueLine} />
          {dict.a11y.scrollHint}
        </p>
      </Grid>
    </Scene>
  )
}
