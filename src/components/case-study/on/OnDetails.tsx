import type { Locale } from '@/i18n/config'
import type { OnCaseCopy } from '@/i18n/dictionaries/case-on'
import { onCrops } from '@/content/projects/on'
import { worlds } from '@/content/worlds'
import { Grid } from '@/components/layout/Grid'
import { Reveal } from '@/components/motion/Reveal'
import { Scene } from '@/components/scene/Scene'
import { ThemeScope } from '@/components/theme/ThemeScope'
import { ChapterHeading } from '../Chapter'
import type { ChapterLink } from '../ChapterIndex'
import { Crop } from '../Crop'
import styles from './OnDetails.module.css'

/**
 * 07 Details: one sequence of craft, examined up close, not a screenshot gallery. The
 * monogram's ribbon large on its wine, then the small things that carry the identity: the
 * signature under the mark, the spaced line, the one action in its two grounds, and the
 * action on a phone. Every detail is a region of the real material, drawn no larger than
 * the material allows; a fine pointer leans in a little.
 */
export function OnDetails({
  locale,
  copy,
  chapter,
}: {
  locale: Locale
  copy: OnCaseCopy['details']
  chapter: ChapterLink
}) {
  const items = copy.items
  return (
    <Scene
      theme={worlds.on}
      atmosphere={{ light: 'pool' }}
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
        <ul role="list" className={styles.mosaic}>
          <li className={styles.ribbon}>
            <figure>
              <ThemeScope theme={worlds.onBordeaux} className={styles.plate}>
                <Crop
                  crop={onCrops.ribbon}
                  locale={locale}
                  width={{ base: 0.8, md: 0.5, lg: 0.4 }}
                  ground="none"
                />
              </ThemeScope>
              <figcaption className={`t-small ${styles.caption}`}>{items.ribbon}</figcaption>
            </figure>
          </li>
          <Reveal as="li" className={styles.lockup}>
            <figure>
              <Crop crop={onCrops.lockup} locale={locale} width={{ base: 0.7, md: 0.3, lg: 0.2 }} />
              <figcaption className={`t-small ${styles.caption}`}>{items.lockup}</figcaption>
            </figure>
          </Reveal>
          <Reveal as="li" order={1} className={styles.eyebrow}>
            <figure>
              <Crop
                crop={onCrops.eyebrow}
                locale={locale}
                width={{ base: 0.8, md: 0.35, lg: 0.22 }}
              />
              <figcaption className={`t-small ${styles.caption}`}>{items.eyebrow}</figcaption>
            </figure>
          </Reveal>
          <Reveal as="li" className={styles.actions}>
            <figure>
              <div className={styles.pair}>
                <Crop
                  crop={onCrops.pillDark}
                  locale={locale}
                  width={{ base: 0.45, md: 0.25, lg: 0.15 }}
                />
                <Crop
                  crop={onCrops.pillLight}
                  locale={locale}
                  width={{ base: 0.45, md: 0.25, lg: 0.15 }}
                />
              </div>
              <figcaption className={`t-small ${styles.caption}`}>{items.actions}</figcaption>
            </figure>
          </Reveal>
          <Reveal as="li" order={1} className={styles.mobileAction}>
            <figure>
              <Crop
                crop={onCrops.mobileAction}
                locale={locale}
                width={{ base: 0.9, md: 0.4, lg: 0.26 }}
              />
              <figcaption className={`t-small ${styles.caption}`}>{items.mobileAction}</figcaption>
            </figure>
          </Reveal>
        </ul>
      </Grid>
    </Scene>
  )
}
