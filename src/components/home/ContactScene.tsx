import type { HomeCopy } from '@/i18n/dictionaries/home'
import { Grid } from '@/components/layout/Grid'
import { Reveal } from '@/components/motion/Reveal'
import { Scene } from '@/components/scene/Scene'
import { thread, worlds } from '@/content/worlds'
import { Convergence } from './Convergence'
import styles from './ContactScene.module.css'

/**
 * Final scene: the different worlds arrive at one invitation. The MARTIN.G world in its
 * lighter graphite, the call to action set calmer than the statement, and beside it the
 * resolution of the page's visual language: product, system and experience arrive as three
 * strands in the colors of the worlds that showed them, meet, and continue as the one
 * amber thread toward the invitation, where it rests. No wordmark here: it belongs to the
 * header, the hero and the footer. The action itself (the contact flow) arrives with
 * Phase 6; until its destination exists no control is rendered, so there is never a dead
 * link.
 */
export function ContactScene({
  copy,
  cycle,
}: {
  copy: HomeCopy['contact']
  /** Product, system, experience. */
  cycle: readonly string[]
}) {
  const [product = '', system = '', experience = ''] = cycle
  return (
    <Scene
      theme={worlds.graphite}
      ambient
      atmosphere={{ light: 'shaft', grid: 'hidden', texture: 'grain', vignette: true }}
      aria-labelledby="contact-title"
      className={styles.scene}
    >
      <Grid className={styles.grid}>
        <Reveal as="h2" variant="mask" id="contact-title" className={`t-heading-1 ${styles.title}`}>
          {copy.title}
        </Reveal>
        <p className={`t-heading-2 ${styles.line}`}>{copy.line}</p>
        <div className={styles.visual}>
          <Convergence
            strands={[
              { label: product, color: thread.miMaMo },
              { label: system, color: thread.defense },
              { label: experience, color: thread.on },
            ]}
            resolve={thread.contact}
          />
        </div>
      </Grid>
    </Scene>
  )
}
