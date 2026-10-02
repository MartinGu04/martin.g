import type { Dictionary } from '@/i18n/dictionaries'
import { Grid } from '@/components/layout/Grid'
import { Ltr } from '@/components/type/Ltr'
import { Scene } from '@/components/scene/Scene'
import { DepthType } from '@/components/scene/DepthType'
import { HeroSymbol } from './HeroSymbol'
import styles from './HeroScene.module.css'

interface HeroSceneProps {
  dict: Dictionary
  name: string
  role: string
}

/**
 * Scene 01: identity, proposition, principle, in one frame and within about two seconds.
 *   beat 1  Martin Gusin, Product Builder: a byline where reading starts
 *   beat 2  Digital products, systems & experiences.
 *   beat 3  From problem to product. (the visual peak, and the page's h1)
 * The brand is already in the header, so the hero does not repeat the wordmark: the
 * message carries the frame, and the MG symbol appears only as a faint hairline drawing at
 * the far side (HeroSymbol). The h1 is the visible headline, introduced by the brand name
 * for assistive technology. The beats are timed on arrival, not tied to scrolling. Without
 * scripting or with reduced motion everything is simply there. One ambient layer only: the
 * key light drifts very slowly across the frame.
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
      <HeroSymbol />
      <Grid className={styles.grid}>
        <p className={styles.identity}>
          <span className={`t-heading-3 ${styles.name}`}>
            <Ltr>{name}</Ltr>
          </span>
          <span className="t-label muted">{role}</span>
        </p>
        <p className={`t-heading-2 ${styles.positioning}`}>{dict.site.positioning}</p>
        <h1 id="hero-title" className={`t-display-xl ${styles.statement}`}>
          <span className="visually-hidden">
            <Ltr>{dict.site.name}</Ltr>:{' '}
          </span>
          {dict.site.principle}
        </h1>
        <p className={`t-micro muted ${styles.cue}`} aria-hidden="true">
          <span className={styles.cueLine} />
          {dict.a11y.scrollHint}
        </p>
      </Grid>
    </Scene>
  )
}
