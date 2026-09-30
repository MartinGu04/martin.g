import type { Dictionary } from '@/i18n/dictionaries'
import { Wordmark } from '@/components/brand/BrandMark'
import { Grid } from '@/components/layout/Grid'
import { GridLines } from '@/components/layout/GridLines'
import styles from './HeroPlaceholder.module.css'

/**
 * ARCHITECTURAL PLACEHOLDER, not the cinematic hero (a later phase). It is the static,
 * composed end state on the production grid and type system: no motion, no scroll
 * choreography. Rules the real hero must keep: the h1 is real text, nothing is hidden
 * behind JavaScript, and the wordmark is never rendered below its legible size.
 */
export function HeroPlaceholder({ dict }: { dict: Dictionary }) {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <GridLines className={styles.lines} />
      <Grid className={styles.grid}>
        <h1 id="hero-title" className={styles.title}>
          <span className="visually-hidden">{dict.site.name}</span>
          <Wordmark decorative width="100%" />
        </h1>
        <div className={styles.statement}>
          <p className="t-heading-2">{dict.site.positioning}</p>
          <p className="t-heading-2 muted">{dict.site.principle}</p>
        </div>
      </Grid>
      <div className={`container ${styles.scroll}`} aria-hidden="true">
        <span className={styles.scrollLine} />
        <span className="t-micro muted">{dict.a11y.scrollHint}</span>
      </div>
    </section>
  )
}
