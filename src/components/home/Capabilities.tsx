import { Fragment } from 'react'
import type { HomeCopy } from '@/i18n/dictionaries/home'
import type { CapabilityKey } from '@/i18n/dictionaries/showcase'
import { thread, worlds } from '@/content/worlds'
import { Grid } from '@/components/layout/Grid'
import { IndexNumber } from '@/components/type/IndexNumber'
import { Reveal } from '@/components/motion/Reveal'
import { Name } from '@/components/type/Name'
import { Scene } from '@/components/scene/Scene'
import { Thread } from '@/components/scene/Thread'
import { CapabilityGlyph } from './CapabilityGlyph'
import styles from './Capabilities.module.css'

export interface Capability {
  key: CapabilityKey
  label: string
  /** What the capability means, in one sentence. */
  statement: string
  /** The work that proves it: links to the scenes on this page where it can be seen. */
  evidence: { href: `#${string}`; title: string }[]
}

/**
 * Scene 07: capabilities as a proof system, not a skill matrix. A clear headline and its
 * claim; one very slow typographic rail of the names (decorative, an ambient loop, never
 * needed to read the list); then an editorial grid in which each discipline is a small
 * number and its glyph, a name, one sentence of what it means, and the real work that
 * proves it, linked to that work on this page. No metrics, no cards. Daylight after
 * the dark worlds: bone and ink, a rust accent the thread carries in, and muted sage for
 * the glyphs and the evidence rules.
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
        <Thread from={thread.process} to={thread.capabilities} />
        <h2 id="capabilities-title" className={`t-heading-1 ${styles.title}`}>
          {copy.title}
        </h2>
        <p className={`t-statement muted ${styles.lead}`}>{copy.lead}</p>
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
            <Reveal as="li" key={item.key} order={i % 3} className={styles.item}>
              <span className={styles.mark}>
                <IndexNumber
                  value={String(i + 1).padStart(2, '0')}
                  className={`t-label ${styles.index}`}
                />
                <CapabilityGlyph name={item.key} className={styles.glyph} />
              </span>
              <h3 className={`t-heading-3 ${styles.name}`}>{item.label}</h3>
              <p className={`t-body-l muted ${styles.statement}`}>{item.statement}</p>
              <p className={`t-action ${styles.evidence}`}>
                <span className={styles.evidenceRule} aria-hidden="true" />
                {item.evidence.map((proof, j) => (
                  <Fragment key={proof.href}>
                    {j > 0 ? (
                      <span className={styles.sep} aria-hidden="true">
                        ·
                      </span>
                    ) : null}
                    <a href={proof.href} className={styles.proof}>
                      <Name>{proof.title}</Name>
                    </a>
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
