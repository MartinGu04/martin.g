import type { Locale } from '@/i18n/config'
import type { MiMaMoCaseCopy, MiMaMoDecisionKey } from '@/i18n/dictionaries/case-mi-ma-mo'
import type { ShowcaseCopy } from '@/i18n/dictionaries/showcase'
import type { ImageCrop } from '@/content/schema'
import { miMaMoCrops } from '@/content/projects/mi-ma-mo'
import { worlds } from '@/content/worlds'
import { Grid } from '@/components/layout/Grid'
import { IndexNumber } from '@/components/type/IndexNumber'
import { Reveal } from '@/components/motion/Reveal'
import { Scene } from '@/components/scene/Scene'
import { ChapterHeading } from '../Chapter'
import type { ChapterLink } from '../ChapterIndex'
import { Crop, type CropWidth } from '../Crop'
import styles from './MiMaMoDecisions.module.css'

type View = keyof ShowcaseCopy['miMaMo']['views']

/**
 * The evidence for each decision: a region of the screen where it can be seen, and that
 * screen's name. `wide` evidence (a whole row of the interface) runs across the entry
 * instead of beside its reasoning, so it is never shrunk below reading size.
 */
const evidence: Record<
  MiMaMoDecisionKey,
  { crop: ImageCrop; view: View; width: CropWidth; wide?: boolean }
> = {
  nextShift: {
    crop: miMaMoCrops.homeOrder,
    view: 'home',
    width: { base: 0.95, md: 0.6, lg: 0.34 },
  },
  week: { crop: miMaMoCrops.weekView, view: 'teamWeek', width: { base: 0.95, md: 0.6, lg: 0.52 } },
  roles: {
    crop: miMaMoCrops.roleHeaders,
    view: 'teamWeek',
    width: { base: 0.95, md: 0.95, lg: 0.72 },
    wide: true,
  },
  snapshot: {
    crop: miMaMoCrops.snapshot,
    view: 'manager',
    width: { base: 0.95, md: 0.95, lg: 0.84 },
    wide: true,
  },
  phone: { crop: miMaMoCrops.phoneOrder, view: 'mobile', width: { base: 0.9, md: 0.45, lg: 0.26 } },
}

const order = [
  'nextShift',
  'week',
  'roles',
  'snapshot',
  'phone',
] as const satisfies readonly MiMaMoDecisionKey[]

/**
 * 06 Key decisions, as a log rather than an editorial list: each entry is numbered, named,
 * reasoned in one or two sentences grounded in what the screens show, and filed with its
 * evidence (labelled with the screen it comes from), at about the evidence's own size.
 */
export function MiMaMoDecisions({
  locale,
  copy,
  views,
  chapter,
}: {
  locale: Locale
  copy: MiMaMoCaseCopy
  views: ShowcaseCopy['miMaMo']['views']
  chapter: ChapterLink
}) {
  const c = copy.decisions
  return (
    <Scene
      theme={worlds.miMaMo}
      atmosphere={{ light: 'none', grid: 'light', marks: false }}
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
        <ol role="list" className={styles.log}>
          {order.map((key, i) => {
            const item = c.items[key]
            const proof = evidence[key]
            return (
              <li key={key} className={styles.entry} data-wide={proof.wide ? '' : undefined}>
                <IndexNumber
                  value={String(i + 1).padStart(2, '0')}
                  className={`t-label ${styles.number}`}
                />
                <div className={styles.reasoning}>
                  <h3 className="t-heading-3">{item.title}</h3>
                  <p className="t-body-l muted">{item.body}</p>
                </div>
                <Reveal as="figure" className={styles.exhibit}>
                  <figcaption className={`t-label ${styles.source}`}>
                    <span className={styles.sourceMark} aria-hidden="true" />
                    {locale === 'he' ? (
                      // Hebrew: the prefix (ending in a maqaf) joins the view's name directly.
                      <span>
                        {copy.ui.evidence}
                        <span className={styles.view}>{views[proof.view]}</span>
                      </span>
                    ) : (
                      <>
                        {copy.ui.evidence}
                        <span aria-hidden="true"> · </span>
                        <span className={styles.view}>{views[proof.view]}</span>
                      </>
                    )}
                  </figcaption>
                  <div
                    className={styles.frame}
                    style={{ maxInlineSize: `${proof.crop.region.width}px` }}
                  >
                    <Crop crop={proof.crop} locale={locale} width={proof.width} />
                  </div>
                </Reveal>
              </li>
            )
          })}
        </ol>
      </Grid>
    </Scene>
  )
}
