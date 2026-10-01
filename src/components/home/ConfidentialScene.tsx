import type { Dictionary } from '@/i18n/dictionaries'
import type { ConfidentialProjectSummary } from '@/content/resolve'
import { thread, worlds } from '@/content/worlds'
import { Grid } from '@/components/layout/Grid'
import { Eyebrow } from '@/components/type/Eyebrow'
import { IndexNumber } from '@/components/type/IndexNumber'
import { Ltr } from '@/components/type/Ltr'
import { Reveal } from '@/components/motion/Reveal'
import { SystemDiagram } from '@/components/project/SystemDiagram'
import { Scene } from '@/components/scene/Scene'
import { Thread } from '@/components/scene/Thread'
import { SystemField } from './SystemField'
import styles from './ConfidentialScene.module.css'

type Item = ConfidentialProjectSummary & { number: string }

/**
 * Scene 05: Defense Systems, operational systems built for a defense environment. A
 * gunmetal register holds a framed archive: restrained corner marks, a hairline boundary
 * that draws closed from its corners on arrival, technical micro type, and a generated
 * system diagram per project (topology, data pathways, masked structural blocks) with a
 * slow scan while the scene is visible. The thread arrives here in cold steel. Behind it all,
 * a very faint, static field of system geometry (SystemField): out-of-focus panel
 * silhouettes, grid fragments and topology, never a screen. The diagrams are abstract and say so by being
 * abstract: no fake interface, no labels, no data. Truthful: the page is not access
 * controlled and does not pretend to be; no classified, warning or dossier language.
 *
 * Sanitized summaries only: no links, no routes, no media, no identifying detail. The
 * items are not interactive, so nothing here takes focus; hover only brightens geometry.
 */
export function ConfidentialScene({ items, dict }: { items: Item[]; dict: Dictionary }) {
  const range = items.map((item) => item.number).join('–')
  return (
    <Scene
      theme={worlds.confidential}
      ambient
      id="confidential"
      className={styles.scene}
      aria-labelledby="confidential-title"
    >
      <SystemField />
      <Grid className={styles.grid}>
        <Thread from={thread.miMaMo} to={thread.defense} />
        <div className={`col-full ${styles.archive}`}>
          <span className={styles.boundary} aria-hidden="true" />
          <span className={styles.corners} aria-hidden="true" />
          <header className={styles.head}>
            <Eyebrow as="h2" id="confidential-title" muted={false}>
              {dict.work.confidentialTitle}
            </Eyebrow>
            <span className={styles.rule} aria-hidden="true" />
            <IndexNumber value={range} className={`t-label muted ${styles.range}`} />
            <p className={`t-body-l muted ${styles.note}`}>{dict.work.confidentialNote}</p>
          </header>
          <ul role="list" className={styles.list}>
            {items.map((item, i) => (
              <Reveal as="li" key={item.id} order={i} variant="fade" className={styles.item}>
                <div className={styles.cover} data-parallax>
                  <SystemDiagram pattern={item.pattern} />
                </div>
                <p className={`t-label ${styles.index}`}>
                  <IndexNumber value={item.number} />
                  <span className={styles.rule} aria-hidden="true" />
                </p>
                <h3 className={`t-heading-2 ${styles.name}`}>{item.title}</h3>
                <p className={`t-body-l muted ${styles.summary}`}>{item.summary}</p>
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
        </div>
      </Grid>
    </Scene>
  )
}
