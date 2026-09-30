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
 * Scene 06: a deliberate energy drop. A hard cut into restrained monochrome graphite:
 * strong type, abstract generated geometry, almost no motion. Sanitized summaries only:
 * no links, no routes, no media, no identifying detail.
 */
export function ConfidentialScene({ items, dict }: { items: Item[]; dict: Dictionary }) {
  return (
    <Scene theme={worlds.confidential} id="confidential" aria-labelledby="confidential-title">
      <Grid className={styles.grid}>
        <Eyebrow
          as="h2"
          id="confidential-title"
          muted={false}
          className={`col-full ${styles.heading}`}
        >
          {dict.work.confidentialTitle}
        </Eyebrow>
        <p className={`col-full t-small muted ${styles.note}`}>{dict.work.confidentialNote}</p>
        <ul role="list" className={`col-full ${styles.list}`}>
          {items.map((item, i) => (
            <Reveal as="li" key={item.id} order={i} variant="fade" className={styles.item}>
              <div className={styles.cover} data-parallax>
                <AbstractCover pattern={item.pattern} />
              </div>
              <IndexNumber value={item.number} className="t-label muted" />
              <h3 className="t-heading-2">{item.title}</h3>
              <p className="t-body muted">{item.summary}</p>
              <p className="t-small muted">
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
      </Grid>
    </Scene>
  )
}
