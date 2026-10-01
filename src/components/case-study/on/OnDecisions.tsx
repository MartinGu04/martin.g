import type { Locale } from '@/i18n/config'
import type { OnCaseCopy, OnDecisionKey } from '@/i18n/dictionaries/case-on'
import type { ImageCrop } from '@/content/schema'
import { onCrops } from '@/content/projects/on'
import { worlds } from '@/content/worlds'
import { Grid } from '@/components/layout/Grid'
import { IndexNumber } from '@/components/type/IndexNumber'
import { Reveal } from '@/components/motion/Reveal'
import { Scene } from '@/components/scene/Scene'
import { ChapterHeading } from '../Chapter'
import type { ChapterLink } from '../ChapterIndex'
import { Crop, type CropWidth } from '../Crop'
import styles from './OnDecisions.module.css'

/**
 * Each decision is shown with the piece of the real site that proves it: the site's own
 * words, or a detail of its screens at a readable size. `wide` evidence (a whole row of
 * the site) runs under the decision instead of beside it.
 */
const evidence: Record<OnDecisionKey, { crop?: ImageCrop; width?: CropWidth; wide?: boolean }> = {
  language: {},
  rhythm: { crop: onCrops.rhythm, width: { base: 0.9, md: 0.45, lg: 0.32 } },
  place: { crop: onCrops.datePlace, width: { base: 0.9, md: 0.45, lg: 0.3 } },
  exclusive: { crop: onCrops.numbers, width: { base: 1, md: 0.9, lg: 0.75 }, wide: true },
  application: { crop: onCrops.cta, width: { base: 0.9, md: 0.45, lg: 0.3 } },
  mobile: { crop: onCrops.mobileTop, width: { base: 0.9, md: 0.4, lg: 0.26 } },
}

const order = [
  'language',
  'rhythm',
  'place',
  'exclusive',
  'application',
  'mobile',
] as const satisfies readonly OnDecisionKey[]

/**
 * 05 Key decisions: six real decisions, numbered, in an editorial list (no cards). Each
 * is a title, one or two sentences of reasoning grounded in what the site shows, and its
 * evidence. Nothing here is a generic principle or an invented rationale.
 */
export function OnDecisions({
  locale,
  copy,
  chapter,
}: {
  locale: Locale
  copy: OnCaseCopy['decisions']
  chapter: ChapterLink
}) {
  return (
    <Scene
      theme={worlds.on}
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
        <ol role="list" className={styles.list}>
          {order.map((key, i) => {
            const item = copy.items[key]
            const proof = evidence[key]
            return (
              <li key={key} className={styles.item} data-wide={proof.wide ? '' : undefined}>
                <IndexNumber
                  value={String(i + 1).padStart(2, '0')}
                  className={`t-label ${styles.number}`}
                />
                <div className={styles.reasoning}>
                  <h3 className="t-heading-3">{item.title}</h3>
                  <p className="t-body-l">{item.body}</p>
                </div>
                <Reveal className={styles.evidence}>
                  {item.quote ? (
                    <blockquote className={styles.quote}>
                      <p className="t-heading-3">{item.quote.text}</p>
                      {item.quote.original ? (
                        <p className="t-body muted">
                          <bdi lang="he" dir="rtl">
                            {item.quote.original}
                          </bdi>
                        </p>
                      ) : null}
                    </blockquote>
                  ) : null}
                  {proof.crop && proof.width ? (
                    <Crop
                      crop={proof.crop}
                      locale={locale}
                      width={proof.width}
                      className={styles.crop}
                    />
                  ) : null}
                </Reveal>
              </li>
            )
          })}
        </ol>
      </Grid>
    </Scene>
  )
}
