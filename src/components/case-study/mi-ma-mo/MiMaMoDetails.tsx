import type { Locale } from '@/i18n/config'
import type { MiMaMoCaseCopy, MiMaMoDetailKey } from '@/i18n/dictionaries/case-mi-ma-mo'
import type { ImageCrop } from '@/content/schema'
import type { StyleWithVars } from '@/lib/css'
import { miMaMoCrops } from '@/content/projects/mi-ma-mo'
import { worlds } from '@/content/worlds'
import { Grid } from '@/components/layout/Grid'
import { IndexNumber } from '@/components/type/IndexNumber'
import { Reveal } from '@/components/motion/Reveal'
import { Scene } from '@/components/scene/Scene'
import { ChapterHeading } from '../Chapter'
import type { ChapterLink } from '../ChapterIndex'
import { Crop } from '../Crop'
import styles from './MiMaMoDetails.module.css'

/**
 * Each detail: one or two regions of the real screens, drawn a little larger than the
 * screenshot (`zoom`, at most one and a half times) so the mechanism can be examined.
 * Pairs are the same mechanism in two places: the system repeating itself. The two heroes
 * lead (coverage, stated in two states; today, marked in two views); the rest follow
 * smaller.
 */
const bench: readonly {
  key: MiMaMoDetailKey
  crops: readonly ImageCrop[]
  zoom: number
  rank: 'hero' | 'secondary'
}[] = [
  {
    key: 'coverage',
    crops: [miMaMoCrops.coverageFull, miMaMoCrops.coverageNone],
    zoom: 1.25,
    rank: 'hero',
  },
  {
    key: 'today',
    crops: [miMaMoCrops.todayHome, miMaMoCrops.todayWeek],
    zoom: 1.5,
    rank: 'hero',
  },
  { key: 'typeLevels', crops: [miMaMoCrops.typeLevels], zoom: 1.25, rank: 'secondary' },
  { key: 'timeLeft', crops: [miMaMoCrops.timeLeft], zoom: 1, rank: 'secondary' },
  { key: 'dayNight', crops: [miMaMoCrops.dayNight], zoom: 1.5, rank: 'secondary' },
  { key: 'phoneStack', crops: [miMaMoCrops.phoneStack], zoom: 1, rank: 'secondary' },
]

/**
 * 07 System details: the product's mechanics examined on a bench, not a gallery. Each
 * plate is ruled and numbered like a specimen, holds real regions of the screens at a
 * modest magnification on the dotted ground, and names the mechanism in one line: how
 * coverage is stated, the levels of type in a shift, how today is marked in two places,
 * time left, day and night, and how Home adapts on a phone.
 */
export function MiMaMoDetails({
  locale,
  copy,
  chapter,
}: {
  locale: Locale
  copy: MiMaMoCaseCopy
  chapter: ChapterLink
}) {
  const c = copy.details
  return (
    <Scene
      theme={worlds.miMaMo}
      atmosphere={{ light: 'pool', grid: 'visible', marks: false }}
      as="section"
      id={chapter.id}
      aria-labelledby={`${chapter.id}-title`}
      className={styles.scene}
    >
      <Grid className={styles.grid}>
        <ChapterHeading
          id={`${chapter.id}-title`}
          number={chapter.number}
          name={chapter.name}
          className={styles.heading}
        >
          {c.heading}
        </ChapterHeading>
        <ul role="list" className={styles.bench}>
          {bench.map(({ key, crops, zoom, rank }, i) => (
            <Reveal as="li" key={key} order={i % 2} className={styles.plate}>
              <figure className={styles.figure} data-detail={key} data-rank={rank}>
                <div className={styles.specimen}>
                  {crops.map((crop) => {
                    const style: StyleWithVars = {
                      '--native': `${Math.round(crop.region.width * zoom)}px`,
                    }
                    return (
                      <div key={crop.alt.en} className={styles.region} style={style}>
                        <Crop
                          crop={crop}
                          locale={locale}
                          width={
                            rank === 'hero'
                              ? { base: 0.9, md: 0.45, lg: 0.42 }
                              : { base: 0.9, md: 0.4, lg: 0.3 }
                          }
                        />
                      </div>
                    )
                  })}
                </div>
                <figcaption className={styles.caption}>
                  <IndexNumber
                    value={`${chapter.number}.${i + 1}`}
                    className={`t-label ${styles.index}`}
                  />
                  <span className={rank === 'hero' ? 't-body-l' : 't-body'}>{c.items[key]}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </Grid>
    </Scene>
  )
}
