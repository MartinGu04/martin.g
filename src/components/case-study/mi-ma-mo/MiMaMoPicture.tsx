import type { Locale } from '@/i18n/config'
import type { MiMaMoCaseCopy } from '@/i18n/dictionaries/case-mi-ma-mo'
import { miMaMoCrops, miMaMoMarks } from '@/content/projects/mi-ma-mo'
import { worlds } from '@/content/worlds'
import { Grid } from '@/components/layout/Grid'
import { Reveal } from '@/components/motion/Reveal'
import { Scene } from '@/components/scene/Scene'
import { ChapterHeading } from '../Chapter'
import type { ChapterLink } from '../ChapterIndex'
import { Crop } from '../Crop'
import { Annotated, MarkList, type Mark } from './Annotated'
import { Level } from './Level'
import styles from './MiMaMoPicture.module.css'

const marks = [
  { id: 'nextShift', number: '1', box: miMaMoMarks.picture.nextShift, tag: 'top-right' },
  { id: 'crew', number: '2', box: miMaMoMarks.picture.crew, tag: 'bottom-right' },
  { id: 'coverage', number: '3', box: miMaMoMarks.picture.coverage, tag: 'top-left' },
] as const satisfies readonly Mark[]

/**
 * 02 The operational picture: Home as the evidence. One idea per composition, at about
 * the screen's own size: the next-shift card with its three parts boxed and named (the
 * shift, who is on it, coverage), then what sits around it (the shortcuts above, the week
 * ahead below). The level scale starts here, at one person's shift.
 */
export function MiMaMoPicture({
  locale,
  copy,
  chapter,
}: {
  locale: Locale
  copy: MiMaMoCaseCopy
  chapter: ChapterLink
}) {
  const c = copy.picture
  return (
    <Scene
      theme={worlds.miMaMo}
      atmosphere={{ light: 'pool', marks: false }}
      as="section"
      id={chapter.id}
      aria-labelledby={`${chapter.id}-title`}
      className={styles.scene}
    >
      <Grid className={styles.grid}>
        <Level levels={copy.ui.levels} current={0} className={styles.level} />
        <ChapterHeading
          id={`${chapter.id}-title`}
          number={chapter.number}
          name={chapter.name}
          className={styles.heading}
        >
          {c.heading}
        </ChapterHeading>
        <p className={`t-body-l ${styles.intro}`}>{c.intro}</p>

        <Annotated
          crop={miMaMoCrops.nextShift}
          locale={locale}
          width={{ base: 0.95, md: 0.9, lg: 0.76 }}
          marks={marks}
          className={styles.card}
        />
        <MarkList
          items={marks.map((mark) => ({ id: mark.id, number: mark.number, ...c.marks[mark.id] }))}
          className={styles.legend}
        />

        <Reveal as="figure" className={styles.shortcuts}>
          <Crop
            crop={miMaMoCrops.shortcuts}
            locale={locale}
            width={{ base: 0.95, md: 0.6, lg: 0.36 }}
            className={styles.shortcutsImage}
          />
          <figcaption className={`t-body-l ${styles.caption}`}>{c.shortcuts}</figcaption>
        </Reveal>

        <Reveal as="figure" className={styles.week}>
          <Crop
            crop={miMaMoCrops.weekAhead}
            locale={locale}
            width={{ base: 0.95, md: 0.95, lg: 0.92 }}
          />
          <figcaption className={`t-body-l ${styles.caption}`}>{c.weekAhead}</figcaption>
        </Reveal>
      </Grid>
    </Scene>
  )
}
