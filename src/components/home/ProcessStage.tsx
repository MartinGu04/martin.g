import type { HomeCopy } from '@/i18n/dictionaries/home'
import { processOrder } from '@/i18n/dictionaries/home'
import type { StyleWithVars } from '@/lib/css'
import { Grid } from '@/components/layout/Grid'
import { Ltr } from '@/components/type/Ltr'
import { Scene } from '@/components/scene/Scene'
import { Atmosphere } from '@/components/scene/Atmosphere'
import styles from './ProcessStage.module.css'

/**
 * Scene 07, How I work: five states in one composition, moving from ambiguity to
 * clarity. On a stage with a sticky frame each word takes the frame in turn while the
 * grid behind it sharpens and the haze clears. Without the stage (reduced motion, no
 * scroll-driven animation, a short viewport) it is a composed vertical sequence. Always
 * an ordered list in the document.
 */
export function ProcessStage({ copy }: { copy: HomeCopy['process'] }) {
  const total = String(processOrder.length).padStart(2, '0')
  return (
    <Scene
      enter="dissolve"
      atmosphere={false}
      aria-labelledby="process-title"
      className={styles.stage}
    >
      <div className={styles.frame}>
        <Atmosphere light="shaft" grid="visible" texture="grain" />
        <Grid className={styles.grid}>
          <h2 id="process-title" className={`t-label ${styles.heading}`}>
            {copy.title}
          </h2>
          <ol role="list" className={styles.steps}>
            {processOrder.map((key, i) => {
              const step = copy.steps[key]
              const style: StyleWithVars = { '--i': i }
              return (
                <li key={key} className={styles.step} style={style}>
                  <span className={`t-label t-numeric muted ${styles.count}`}>
                    <Ltr>{`${String(i + 1).padStart(2, '0')} / ${total}`}</Ltr>
                  </span>
                  <h3 className={`t-display-xl ${styles.word}`}>{step.word}</h3>
                  <p className={`t-lead ${styles.line}`}>{step.line}</p>
                </li>
              )
            })}
          </ol>
          <div className={styles.progress} aria-hidden="true">
            {processOrder.map((key, i) => {
              const style: StyleWithVars = { '--i': i }
              return <i key={key} style={style} />
            })}
          </div>
        </Grid>
      </div>
    </Scene>
  )
}
