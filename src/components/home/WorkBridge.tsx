import type { Dictionary } from '@/i18n/dictionaries'
import type { StyleWithVars } from '@/lib/css'
import { worlds } from '@/content/worlds'
import { Grid } from '@/components/layout/Grid'
import { Eyebrow } from '@/components/type/Eyebrow'
import { IndexNumber } from '@/components/type/IndexNumber'
import { Name } from '@/components/type/Name'
import { Scene } from '@/components/scene/Scene'
import { Thread } from '@/components/scene/Thread'
import { thread } from '@/content/worlds'
import styles from './WorkBridge.module.css'

export interface WorkIndexEntry {
  /** In-page anchor of the scene that shows the work. */
  href: `#${string}`
  number: string
  title: string
}

/**
 * The bridge into the work, in a lighter graphite: the section heading between framing
 * lines, and a compact index of what was built, so the proof is visible right after the
 * hero. Each entry jumps to its scene. Below it the thread begins, white turning to ON's
 * gold as it draws, pulling toward the first project world, which opens over the bottom
 * of this one.
 */
export function WorkBridge({ dict, entries }: { dict: Dictionary; entries: WorkIndexEntry[] }) {
  return (
    <Scene as="div" theme={worlds.graphite} className={styles.bridge}>
      <Grid className={styles.grid}>
        <div className={styles.entry}>
          <Eyebrow as="h2" id="work-title" index="01" muted={false} className={styles.label}>
            {dict.work.selectedTitle}
          </Eyebrow>
          <span className={styles.rule} aria-hidden="true" />
        </div>
        <ol
          role="list"
          className={styles.index}
          style={{ '--next-world': thread.on } as StyleWithVars}
        >
          {entries.map((entry) => (
            <li key={entry.href}>
              <a href={entry.href} className={styles.link}>
                <IndexNumber value={entry.number} className="t-label muted" />
                <span className="t-heading-3">
                  <Name>{entry.title}</Name>
                </span>
              </a>
            </li>
          ))}
        </ol>
        <Thread from={thread.bridge} to={thread.on} className={styles.thread} />
      </Grid>
    </Scene>
  )
}
