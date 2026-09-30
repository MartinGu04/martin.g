import type { Dictionary } from '@/i18n/dictionaries'
import type { ConfidentialProjectSummary } from '@/content/resolve'
import { worlds } from '@/content/worlds'
import { Grid } from '@/components/layout/Grid'
import { Eyebrow } from '@/components/type/Eyebrow'
import { IndexNumber } from '@/components/type/IndexNumber'
import { Ltr } from '@/components/type/Ltr'
import { Reveal } from '@/components/motion/Reveal'
import { AbstractCover } from '@/components/project/AbstractCover'
import { Scene } from '@/components/scene/Scene'
import styles from './ConfidentialScene.module.css'

type Item = ConfidentialProjectSummary & { number: string }

/**
 * Scene 06: Restricted Work, a premium restricted archive rather than another cinematic
 * world. A deeper graphite register holds a framed archive: restrained corner marks, a
 * hairline boundary that draws closed from its corners on arrival, technical micro type,
 * and abstract geometry that fades out before its own frame ends, so there is visibly
 * more than is shown. Quieter than ON and mi-ma-mo. Truthful: the page is not access
 * controlled and does not pretend to be.
 *
 * Sanitized summaries only: no links, no routes, no media, no identifying detail. The
 * items are not interactive, so nothing here takes focus; hover only brightens geometry.
 */
export function ConfidentialScene({ items, dict }: { items: Item[]; dict: Dictionary }) {
  const range = items.map((item) => item.number).join('–')
  return (
    <Scene theme={worlds.confidential} id="confidential" aria-labelledby="confidential-title">
      <Grid>
        <div className={`col-full ${styles.archive}`}>
          <span className={styles.boundary} aria-hidden="true" />
          <span className={styles.corners} aria-hidden="true" />
          <header className={styles.head}>
            <Eyebrow as="h2" id="confidential-title" muted={false}>
              {dict.work.confidentialTitle}
            </Eyebrow>
            <span className={styles.rule} aria-hidden="true" />
            <IndexNumber value={range} className={`t-micro muted ${styles.range}`} />
            <p className={`t-small muted ${styles.note}`}>{dict.work.confidentialNote}</p>
          </header>
          <ul role="list" className={styles.list}>
            {items.map((item, i) => (
              <Reveal as="li" key={item.id} order={i} variant="fade" className={styles.item}>
                <div className={styles.cover} data-parallax>
                  <AbstractCover pattern={item.pattern} />
                </div>
                <p className={`t-micro ${styles.index}`}>
                  <IndexNumber value={item.number} />
                  <span className={styles.rule} aria-hidden="true" />
                </p>
                <h3 className={`t-heading-2 ${styles.name}`}>{item.title}</h3>
                <p className="t-body muted">{item.summary}</p>
                <p className="t-micro muted">
                  {item.disciplines.join(' · ')}
                  {item.years ? (
                    <>
                      {' · '}
                      <Ltr>{item.years}</Ltr>
                    </>
                  ) : null}
                </p>
              </Reveal>
            ))}
          </ul>
        </div>
      </Grid>
    </Scene>
  )
}
