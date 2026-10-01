import type { HomeCopy } from '@/i18n/dictionaries/home'
import type { StyleWithVars } from '@/lib/css'
import { Wordmark } from '@/components/brand/BrandMark'
import { Grid } from '@/components/layout/Grid'
import { Reveal } from '@/components/motion/Reveal'
import { Scene } from '@/components/scene/Scene'
import { worlds } from '@/content/worlds'
import styles from './ContactScene.module.css'

/**
 * Final scene: the ending echoes the arrival, compact. The MARTIN.G world in its lighter
 * graphite with a restrained amber, the wordmark again, a confident call to action set
 * calmer than the statement. While the visitor stays, one amber hairline draws and clears
 * and the three things built (product, system, experience) take turns beside it: decorative,
 * an ambient loop. The action itself (the contact flow) arrives with Phase 6; until its
 * destination exists no control is rendered, so there is never a dead link.
 */
export function ContactScene({
  copy,
  cycle,
}: {
  copy: HomeCopy['contact']
  cycle: readonly string[]
}) {
  return (
    <Scene
      theme={worlds.graphite}
      ambient
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
        <div className={styles.ambient} aria-hidden="true">
          <span className={styles.draw} data-loop="" />
          <span className={`t-label ${styles.words}`}>
            {cycle.map((word, i) => (
              <span
                key={word}
                className={styles.word}
                data-loop=""
                style={{ '--i': i } as StyleWithVars}
              >
                {word}
              </span>
            ))}
          </span>
        </div>
      </Grid>
    </Scene>
  )
}
