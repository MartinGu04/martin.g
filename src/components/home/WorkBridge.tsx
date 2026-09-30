import type { Dictionary } from '@/i18n/dictionaries'
import { Grid } from '@/components/layout/Grid'
import { Eyebrow } from '@/components/type/Eyebrow'
import { Reveal } from '@/components/motion/Reveal'
import { Scene } from '@/components/scene/Scene'
import { DepthType } from '@/components/scene/DepthType'
import styles from './WorkBridge.module.css'

/**
 * Scene 03, the bridge: the positioning line, quieter than the statement, then the frame
 * changes register. Framing lines draw in, a huge index numeral rises behind them, and
 * the first project world begins to open over the bottom of this scene (the next scene's
 * wipe). It carries the section heading for the selected work.
 */
export function WorkBridge({ dict }: { dict: Dictionary }) {
  return (
    <Scene
      as="div"
      atmosphere={{ light: 'pool', grid: 'fade', texture: 'grain' }}
      className={styles.bridge}
    >
      <DepthType variant="index">01</DepthType>
      <Grid className={styles.grid}>
        <Reveal as="p" variant="mask" className={`t-display ${styles.positioning}`}>
          {dict.site.positioning}
        </Reveal>
        <div className={styles.entry}>
          <span className={styles.rule} aria-hidden="true" />
          <Eyebrow as="h2" id="work-title" index="01" muted={false} className={styles.label}>
            {dict.work.selectedTitle}
          </Eyebrow>
          <span className={`${styles.rule} ${styles.ruleEnd}`} aria-hidden="true" />
        </div>
      </Grid>
    </Scene>
  )
}
