import type { HomeCopy } from '@/i18n/dictionaries/home'
import { Grid } from '@/components/layout/Grid'
import { Eyebrow } from '@/components/type/Eyebrow'
import { IndexNumber } from '@/components/type/IndexNumber'
import { Reveal } from '@/components/motion/Reveal'
import { Scene } from '@/components/scene/Scene'
import styles from './Capabilities.module.css'

export interface Capability {
  key: string
  label: string
  /** The work that proves it: project titles (sanitized titles for confidential work). */
  proof: string[]
}

/**
 * Scene 08: capabilities as proof, not a skill matrix. Each capability is set large and
 * answered by the work that demonstrates it, taken from the project entries themselves.
 * A calm scene: no light, no grid, a slow rise per row.
 */
export function Capabilities({
  copy,
  items,
}: {
  copy: HomeCopy['capabilities']
  items: Capability[]
}) {
  return (
    <Scene
      atmosphere={{ light: 'none', grid: 'hidden', texture: 'grain', vignette: true }}
      aria-labelledby="capabilities-title"
    >
      <Grid className={styles.grid}>
        <Eyebrow as="h2" id="capabilities-title" muted={false} className="col-aside">
          {copy.title}
        </Eyebrow>
        <p className={`col-main t-lead muted ${styles.lead}`}>{copy.lead}</p>
        <ul role="list" className={styles.list}>
          {items.map((item, i) => (
            <Reveal as="li" key={item.key} order={i % 2} className={styles.row}>
              <IndexNumber
                value={String(i + 1).padStart(2, '0')}
                className={`t-label muted ${styles.index}`}
              />
              <p className={`t-heading-1 ${styles.name}`}>{item.label}</p>
              <p className={`t-small muted ${styles.proof}`}>{item.proof.join(' · ')}</p>
            </Reveal>
          ))}
        </ul>
      </Grid>
    </Scene>
  )
}
