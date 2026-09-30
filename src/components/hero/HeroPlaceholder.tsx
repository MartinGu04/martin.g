import type { Dictionary } from '@/i18n/dictionaries'
import { Wordmark } from '@/components/brand/BrandMark'
import { Cell, Grid } from '@/components/layout/Grid'
import { GridLines } from '@/components/layout/GridLines'
import styles from './HeroPlaceholder.module.css'

/**
 * ARCHITECTURAL PLACEHOLDER. Static, composed final state of the future hero: no motion,
 * no deconstruction, no scroll choreography. Phase 4 replaces it. It already follows the
 * rules the real hero must keep: the h1 is real text, and nothing is hidden behind JS.
 */
export function HeroPlaceholder({ dict }: { dict: Dictionary }) {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <GridLines className={styles.lines} />
      <Grid className={styles.inner}>
        <Cell span={{ base: 4, md: 7, lg: 8 }}>
          <h1 id="hero-title" className={styles.title}>
            <span className="visually-hidden">{dict.site.name}</span>
            <Wordmark decorative width="100%" />
          </h1>
        </Cell>
        <Cell span={{ base: 4, md: 6, lg: 6 }} className={styles.lines2}>
          <p className={styles.positioning}>{dict.site.positioning}</p>
          <p className={`muted ${styles.principle}`}>{dict.site.principle}</p>
        </Cell>
      </Grid>
      <p className={`label muted ${styles.scroll}`} aria-hidden="true">
        {dict.a11y.scrollHint}
      </p>
    </section>
  )
}
