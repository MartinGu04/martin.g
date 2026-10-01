import type { Locale } from '@/i18n/config'
import type { OnCaseCopy } from '@/i18n/dictionaries/case-on'
import { onCrops, onMedia } from '@/content/projects/on'
import { worlds } from '@/content/worlds'
import { Grid } from '@/components/layout/Grid'
import { MediaFrame } from '@/components/media/MediaFrame'
import { Reveal } from '@/components/motion/Reveal'
import { Scene } from '@/components/scene/Scene'
import { ChapterHeading } from '../Chapter'
import type { ChapterLink } from '../ChapterIndex'
import { Crop } from '../Crop'
import styles from './OnWebsite.module.css'

/**
 * 04 From brand to website: the identity working, on the wine ground so the cream and the
 * evening screens both hold. Large, readable views, never thumbnails: the site's structure
 * (its real navigation, with the destinations set out as text), its content rhythm at
 * about its own size, and the phone layout at a phone's size beside what changed. On
 * phones the story view runs edge to edge.
 */
export function OnWebsite({
  locale,
  copy,
  chapter,
}: {
  locale: Locale
  copy: OnCaseCopy['website']
  chapter: ChapterLink
}) {
  return (
    <Scene
      theme={worlds.onBordeaux}
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
          {copy.heading}
        </ChapterHeading>
        <p className={`t-body-l ${styles.intro}`}>{copy.intro}</p>

        <div className={styles.structure}>
          <div className={styles.note}>
            <p className={`t-label ${styles.label}`}>{copy.structure.label}</p>
            <p className="t-body-l">{copy.structure.note}</p>
          </div>
          <div className={styles.navView}>
            <Crop crop={onCrops.nav} locale={locale} width={{ base: 1, md: 0.9, lg: 0.62 }} />
            <ol role="list" className={styles.destinations}>
              {copy.structure.items.map((item, i) => (
                <li key={item} className="t-body">
                  <span className={`t-micro t-numeric ${styles.step}`}>{i + 1}</span>
                  {item}
                </li>
              ))}
              <li className={`t-body ${styles.action}`}>{copy.structure.action}</li>
            </ol>
          </div>
        </div>

        <Reveal as="figure" className={styles.rhythm}>
          <div className={styles.bleed}>
            <MediaFrame
              media={onMedia.siteStory}
              locale={locale}
              sizes="(width >= 75rem) 88vw, 100vw"
            />
          </div>
          <figcaption className={styles.caption}>
            <span className={`t-label ${styles.label}`}>{copy.rhythm.label}</span>
            <span className="t-body-l">{copy.rhythm.note}</span>
          </figcaption>
        </Reveal>

        <div className={styles.mobile}>
          <Crop
            crop={onCrops.siteMobile}
            locale={locale}
            width={{ base: 0.9, md: 0.4, lg: 0.28 }}
            className={styles.device}
          />
          <div className={styles.mobileText}>
            <p className={`t-label ${styles.label}`}>{copy.mobile.label}</p>
            <p className="t-statement">{copy.mobile.body}</p>
          </div>
        </div>
      </Grid>
    </Scene>
  )
}
