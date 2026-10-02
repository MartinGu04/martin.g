import type { Locale } from '@/i18n/config'
import type { MiMaMoCaseCopy } from '@/i18n/dictionaries/case-mi-ma-mo'
import { miMaMoCrops, miMaMoMarks } from '@/content/projects/mi-ma-mo'
import { worlds } from '@/content/worlds'
import { Grid } from '@/components/layout/Grid'
import { Scene } from '@/components/scene/Scene'
import { ChapterHeading } from '../Chapter'
import type { ChapterLink } from '../ChapterIndex'
import { Annotated, MarkList, type Mark } from './Annotated'
import styles from './MiMaMoPhone.module.css'

const marks = [
  { id: 'greeting', number: '1', box: miMaMoMarks.phone.greeting },
  { id: 'shortcuts', number: '2', box: miMaMoMarks.phone.shortcuts },
  { id: 'nextShift', number: '3', box: miMaMoMarks.phone.nextShift },
  { id: 'crew', number: '4', box: miMaMoMarks.phone.crew },
  { id: 'sections', number: '5', box: miMaMoMarks.phone.sections },
] as const satisfies readonly Mark[]

/**
 * 05 One system, different contexts: the real phone screen, not an appendix. At about its
 * own size (never larger), with the same order boxed and numbered top to bottom, and read
 * beside it as a list: greeting and date, the shortcuts (now stacked), the next shift,
 * who is on it with the coverage, and the main sections moved to a bar at the bottom.
 */
export function MiMaMoPhone({
  locale,
  copy,
  chapter,
}: {
  locale: Locale
  copy: MiMaMoCaseCopy
  chapter: ChapterLink
}) {
  const c = copy.phone
  return (
    <Scene
      theme={worlds.miMaMo}
      atmosphere={{ light: 'side', marks: true }}
      as="section"
      id={chapter.id}
      aria-labelledby={`${chapter.id}-title`}
      className={styles.scene}
    >
      <Grid className={styles.grid}>
        <div className={styles.text}>
          <ChapterHeading id={`${chapter.id}-title`} number={chapter.number} name={chapter.name}>
            {c.heading}
          </ChapterHeading>
          <p className="t-body-l">{c.intro}</p>
          <MarkList
            items={marks.map((mark) => ({
              id: mark.id,
              number: mark.number,
              label: c.marks[mark.id],
            }))}
            className={styles.legend}
          />
        </div>
        <div className={styles.device}>
          <Annotated
            crop={miMaMoCrops.phone}
            locale={locale}
            width={{ base: 0.9, md: 0.45, lg: 0.3 }}
            marks={marks}
            ground="none"
          />
        </div>
      </Grid>
    </Scene>
  )
}
