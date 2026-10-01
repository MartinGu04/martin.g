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
import styles from './MiMaMoWeek.module.css'

const marks = [
  { id: 'roles', number: '1', box: miMaMoMarks.week.roles, tag: 'bottom-right' },
  { id: 'entries', number: '2', box: miMaMoMarks.week.entries, tag: 'bottom-right' },
  { id: 'today', number: '3', box: miMaMoMarks.week.today, tag: 'top-left', pulse: true },
] as const satisfies readonly Mark[]

/**
 * 03 Built around the week: Team Week as a spatial surface. The real view runs across the
 * page at about its own size, anchored at its day column (the interface reads right to
 * left, so that edge is the physical right in both languages) and continuing past the
 * other edge of the page, as the view itself continues; three parts of its structure are
 * boxed (the role groups, a day's entries, today, which pulses slowly). Then one day,
 * closer. On phones, the day column and the columns nearest it.
 */
export function MiMaMoWeek({
  locale,
  copy,
  chapter,
}: {
  locale: Locale
  copy: MiMaMoCaseCopy
  chapter: ChapterLink
}) {
  const c = copy.week
  return (
    <Scene
      theme={worlds.miMaMo}
      atmosphere={{ light: 'side', grid: 'light', marks: false }}
      ambient
      as="section"
      id={chapter.id}
      aria-labelledby={`${chapter.id}-title`}
      className={styles.scene}
    >
      <Grid className={styles.grid}>
        <Level levels={copy.ui.levels} current={1} className={styles.level} />
        <ChapterHeading
          id={`${chapter.id}-title`}
          number={chapter.number}
          name={chapter.name}
          className={styles.heading}
        >
          {c.heading}
        </ChapterHeading>
        <p className={`t-body-l ${styles.intro}`}>{c.intro}</p>
      </Grid>

      <div className={styles.band}>
        <Annotated
          crop={miMaMoCrops.teamWeek}
          locale={locale}
          width={{ base: 0.95, md: 0.95, lg: 1 }}
          marks={marks}
          className={styles.week}
        />
      </div>

      <Grid className={styles.grid}>
        <MarkList
          items={marks.map((mark) => ({ id: mark.id, number: mark.number, ...c.marks[mark.id] }))}
          className={styles.legend}
        />
        <Reveal as="figure" className={styles.day}>
          <Crop
            crop={miMaMoCrops.dayRow}
            locale={locale}
            width={{ base: 0.95, md: 0.95, lg: 0.84 }}
            className={styles.dayImage}
          />
          <figcaption className={`t-body-l ${styles.caption}`}>{c.day}</figcaption>
        </Reveal>
      </Grid>
    </Scene>
  )
}
