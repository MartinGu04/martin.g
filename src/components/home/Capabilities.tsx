import { Fragment } from 'react'
import type { HomeCopy } from '@/i18n/dictionaries/home'
import { Grid } from '@/components/layout/Grid'
import { IndexNumber } from '@/components/type/IndexNumber'
import { Reveal } from '@/components/motion/Reveal'
import { Name } from '@/components/type/Name'
import { Scene } from '@/components/scene/Scene'
import { worlds } from '@/content/worlds'
import styles from './Capabilities.module.css'

export interface Capability {
  key: string
  label: string
  /** The work that proves it: project titles (sanitized titles for confidential work). */
  proof: string[]
}

/**
 * Scene 07: capabilities as proof, not a skill matrix. A clear section headline and its
 * claim, then each capability at a supporting scale, answered by the work that
 * demonstrates it (taken from the project entries themselves). Between them, one very
 * slow typographic rail of the same names: decorative, an ambient loop, never needed to
 * read the list. Daylight after the dark worlds: bone, ink and one warm accent.
 */
export function Capabilities({
  copy,
  items,
}: {
  copy: HomeCopy['capabilities']
  items: Capability[]
}) {
  const rail = items.map((item) => item.label)
  return (
    <Scene
      theme={worlds.bone}
      ambient
      aria-labelledby="capabilities-title"
      className={styles.scene}
    >
      <Grid className={styles.grid}>
        <h2 id="capabilities-title" className={`t-heading-1 ${styles.title}`}>
          {copy.title}
        </h2>
        <p className={`t-lead muted ${styles.lead}`}>{copy.lead}</p>
      </Grid>
      <div className={styles.rail} aria-hidden="true">
        <div className={styles.track} data-loop="">
          {[0, 1].map((copyIndex) => (
            <span key={copyIndex} className={styles.run}>
              {rail.map((label) => (
                <Fragment key={label}>
                  <span className="t-heading-2">{label}</span>
                  <span className={styles.dot} />
                </Fragment>
              ))}
            </span>
          ))}
        </div>
      </div>
      <Grid>
        <ul role="list" className={styles.list}>
          {items.map((item, i) => (
            <Reveal as="li" key={item.key} order={i % 2} className={styles.row}>
              <IndexNumber
                value={String(i + 1).padStart(2, '0')}
                className={`t-label ${styles.index}`}
              />
              <p className={`t-heading-3 ${styles.name}`}>{item.label}</p>
              <p className={`t-small muted ${styles.proof}`}>
                {item.proof.map((title, j) => (
                  <Fragment key={title}>
                    {j > 0 ? ' · ' : null}
                    <Name>{title}</Name>
                  </Fragment>
                ))}
              </p>
            </Reveal>
          ))}
        </ul>
      </Grid>
    </Scene>
  )
}
