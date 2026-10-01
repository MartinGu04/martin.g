import type { Locale } from '@/i18n/config'
import type { MiMaMoCaseCopy } from '@/i18n/dictionaries/case-mi-ma-mo'
import { miMaMoCrops } from '@/content/projects/mi-ma-mo'
import { worlds } from '@/content/worlds'
import { Grid } from '@/components/layout/Grid'
import { Reveal } from '@/components/motion/Reveal'
import { Scene } from '@/components/scene/Scene'
import { ChapterHeading } from '../Chapter'
import type { ChapterLink } from '../ChapterIndex'
import { Crop } from '../Crop'
import { Level } from './Level'
import styles from './MiMaMoManagement.module.css'

const shifts = ['previous', 'current', 'next'] as const

/**
 * 04 Management at a glance: a change of level, so a change of ground. The world opens
 * from its center seam onto the interface's own deep card blue, and the level scale moves
 * to the operation. The manager area's own subtitle says what it is for (quoted, with a
 * translation on the English page); the evidence is its snapshot, one shift per card in
 * reading order (previous, current, next), each at about its own size, and the emergency
 * mode panel exactly as the screenshot shows it.
 */
export function MiMaMoManagement({
  locale,
  copy,
  chapter,
}: {
  locale: Locale
  copy: MiMaMoCaseCopy
  chapter: ChapterLink
}) {
  const c = copy.management
  return (
    <Scene
      theme={worlds.miMaMoCard}
      enter="split"
      as="section"
      id={chapter.id}
      aria-labelledby={`${chapter.id}-title`}
      className={styles.scene}
    >
      <Grid className={styles.grid}>
        <Level levels={copy.ui.levels} current={2} className={styles.level} />
        <div className={styles.lead}>
          <ChapterHeading id={`${chapter.id}-title`} number={chapter.number} name={chapter.name}>
            {c.heading}
          </ChapterHeading>
          <p className="t-body-l">{c.intro}</p>
        </div>
        <figure className={styles.words}>
          <figcaption className={`t-label ${styles.wordsLabel}`}>{c.quoteLabel}</figcaption>
          <blockquote className={styles.quote}>
            <p className="t-heading-3">{c.quote.text}</p>
            {c.quote.original ? (
              <p className="t-body muted">
                <bdi lang="he" dir="rtl">
                  {c.quote.original}
                </bdi>
              </p>
            ) : null}
          </blockquote>
        </figure>

        <ol role="list" className={styles.snapshot}>
          {shifts.map((key, i) => (
            <Reveal as="li" key={key} order={i} className={styles.shift}>
              <p className={styles.shiftHead}>
                <span className={`t-label ${styles.shiftLabel}`}>{c.snapshot[key].label}</span>
                <span className="t-small muted">{c.snapshot[key].note}</span>
              </p>
              <Crop
                crop={miMaMoCrops[key]}
                locale={locale}
                width={{ base: 0.95, md: 0.32, lg: 0.3 }}
                className={styles.card}
              />
            </Reveal>
          ))}
        </ol>

        <figure className={styles.emergency}>
          <figcaption className={styles.emergencyText}>
            <span className={`t-label ${styles.shiftLabel}`}>{c.emergency.label}</span>
            <span className="t-body-l">{c.emergency.note}</span>
          </figcaption>
          <Crop
            crop={miMaMoCrops.emergency}
            locale={locale}
            width={{ base: 0.95, md: 0.95, lg: 0.92 }}
            className={styles.panel}
          />
        </figure>
      </Grid>
    </Scene>
  )
}
