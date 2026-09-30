import type { Dictionary } from '@/i18n/dictionaries'
import { Wordmark } from '@/components/brand/BrandMark'
import { Grid } from '@/components/layout/Grid'
import { Scene } from '@/components/scene/Scene'
import { DepthType } from '@/components/scene/DepthType'
import styles from './HeroPlaceholder.module.css'

/**
 * STATIC HERO FRAME, not the final cinematic hero (its motion comes in a later phase).
 * It fixes the composition and scale the real hero keeps: a refined wordmark against a
 * monumental, heavy statement that runs to the edge of the frame, inside the brand
 * world's light. Rules the real hero must keep: the h1 is real text, nothing is hidden
 * behind JavaScript, and the wordmark is never rendered below its legible size.
 */
export function HeroPlaceholder({ dict }: { dict: Dictionary }) {
  return (
    <Scene
      size="frame"
      atmosphere={{ light: 'shaft', grid: 'light', texture: 'grain', marks: true }}
      aria-labelledby="hero-title"
      className={styles.hero}
    >
      <DepthType variant="line">{dict.site.principle}</DepthType>
      <Grid className={styles.grid}>
        <h1 id="hero-title" className={styles.title}>
          <span className="visually-hidden">{dict.site.name}</span>
          <Wordmark decorative width="100%" />
        </h1>
        <p className={`t-hero ${styles.statement}`}>{dict.site.principle}</p>
        <p className={`t-lead ${styles.support}`}>{dict.site.positioning}</p>
        <p className={`t-micro muted ${styles.cue}`} aria-hidden="true">
          <span className={styles.cueLine} />
          {dict.a11y.scrollHint}
        </p>
      </Grid>
    </Scene>
  )
}
