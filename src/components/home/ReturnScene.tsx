import type { Dictionary } from '@/i18n/dictionaries'
import { Grid } from '@/components/layout/Grid'
import { Eyebrow } from '@/components/type/Eyebrow'
import { Scene } from '@/components/scene/Scene'
import { DepthType } from '@/components/scene/DepthType'
import styles from './ReturnScene.module.css'

/**
 * A visual reset between two project worlds: the MARTIN.G world dissolves back in over
 * the tail of the previous world, quiet and nearly empty, with the next index numeral
 * rising behind the framing line. A breath before the technical world.
 */
export function ReturnScene({ index, dict }: { index: string; dict: Dictionary }) {
  return (
    <Scene
      as="div"
      enter="dissolve"
      atmosphere={{ light: 'side', grid: 'hidden', texture: 'grain' }}
      className={styles.scene}
    >
      <DepthType variant="index">{index}</DepthType>
      <Grid>
        <div className={styles.entry}>
          <Eyebrow index={index} className={styles.label}>
            {dict.work.selectedTitle}
          </Eyebrow>
          <span className={styles.rule} aria-hidden="true" />
        </div>
      </Grid>
    </Scene>
  )
}
