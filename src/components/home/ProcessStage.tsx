import type { HomeCopy } from '@/i18n/dictionaries/home'
import { processOrder } from '@/i18n/dictionaries/home'
import type { StyleWithVars } from '@/lib/css'
import { Grid } from '@/components/layout/Grid'
import { Ltr } from '@/components/type/Ltr'
import { Scene } from '@/components/scene/Scene'
import { Thread } from '@/components/scene/Thread'
import { thread } from '@/content/worlds'
import { ProcessGlyph } from './ProcessGlyph'
import styles from './ProcessStage.module.css'

/**
 * Scene 06, How I Work: how a problem becomes a product. A real section heading and its
 * one-line thought, then the five steps, always an ordered list, readable at once. While
 * the scene is visible the process advances on its own (about three seconds a step): the
 * current step brightens in the list, its word takes the frame beside it with its line,
 * and a five-part rule fills in the reading direction (the scan of the thread). Pointing
 * at a step takes over: that step becomes current and the clock waits until the pointer
 * leaves, then continues where it was. Above the current word stands its stage's line
 * glyph (focus, boundary, grid, modules, loop), changing with it on the same clock.
 * Nothing waits for scrolling. Without scripting or with reduced motion it is the list
 * alone.
 */
export function ProcessStage({ copy }: { copy: HomeCopy['process'] }) {
  const total = String(processOrder.length).padStart(2, '0')
  return (
    <Scene
      enter="dissolve"
      ambient
      atmosphere={{ light: 'shaft', grid: 'light', texture: 'grain' }}
      aria-labelledby="process-title"
      className={styles.stage}
    >
      <Grid className={styles.grid}>
        <Thread from={thread.defense} to={thread.process} />
        <header className={styles.head}>
          <h2 id="process-title" className="t-heading-1">
            {copy.title}
          </h2>
          <p className="t-statement muted">{copy.lead}</p>
        </header>
        <ol role="list" className={styles.steps}>
          {processOrder.map((key, i) => {
            const step = copy.steps[key]
            const style: StyleWithVars = { '--i': i }
            return (
              <li key={key} className={styles.step} style={style} data-loop="">
                <span className={`t-label t-numeric muted ${styles.count}`}>
                  <Ltr>{`${String(i + 1).padStart(2, '0')} / ${total}`}</Ltr>
                </span>
                <h3 className={`t-heading-3 ${styles.word}`}>{step.word}</h3>
                <p className={`t-body-l muted ${styles.line}`}>{step.line}</p>
              </li>
            )
          })}
        </ol>
        {/* The frame: a decorative echo of the current step, beside the list. */}
        <div className={styles.frame} aria-hidden="true">
          <div className={styles.words}>
            {processOrder.map((key, i) => (
              <div
                key={key}
                className={styles.current}
                style={{ '--i': i } as StyleWithVars}
                data-loop=""
              >
                <ProcessGlyph step={key} className={styles.bigGlyph} />
                <span className={`t-display ${styles.big}`}>{copy.steps[key].word}</span>
                <span className={`t-statement ${styles.bigLine}`}>{copy.steps[key].line}</span>
              </div>
            ))}
          </div>
          <div className={styles.progress}>
            {processOrder.map((key, i) => (
              <i key={key} style={{ '--i': i } as StyleWithVars} data-loop="" />
            ))}
          </div>
        </div>
      </Grid>
    </Scene>
  )
}
