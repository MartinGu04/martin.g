import type { HomeCopy } from '@/i18n/dictionaries/home'
import type { StyleWithVars } from '@/lib/css'
import { Wordmark } from '@/components/brand/BrandMark'
import { Grid } from '@/components/layout/Grid'
import { Reveal } from '@/components/motion/Reveal'
import { Scene } from '@/components/scene/Scene'
import { thread, worlds } from '@/content/worlds'
import styles from './ContactScene.module.css'

/**
 * Final scene: the ending echoes the arrival, compact. The MARTIN.G world in its lighter
 * graphite with a restrained amber, the wordmark again, a confident call to action set
 * calmer than the statement. Here the thread resolves: it draws once from About's warm
 * light into the closing amber, ends in an open square, and stays still. Beside it the
 * three things built (product, system, experience) take turns while the visitor stays:
 * decorative, an ambient loop. The action itself (the contact flow) arrives with Phase 6; until its
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
          <span
            className={styles.draw}
            style={
              { '--thread-from': thread.about, '--thread-to': thread.contact } as StyleWithVars
            }
          />
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
