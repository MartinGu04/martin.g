import Link from 'next/link'
import type { Locale } from '@/i18n/config'
import type { TrustPageCopy } from '@/i18n/dictionaries/legal'
import { trustHref } from '@/lib/trust'
import { worlds } from '@/content/worlds'
import { Grid } from '@/components/layout/Grid'
import { Rule } from '@/components/layout/Rule'
import { Scene } from '@/components/scene/Scene'
import { Arrow } from '@/components/type/Arrow'
import styles from './TrustPage.module.css'

/**
 * Privacy and Accessibility (Phase 6): plain, readable pages in the bone register, the
 * brand's own daylight. One h1, a short lead, then sections as h2 with paragraphs and
 * lists; a section may end with a link to another page of the site. No legal theatre.
 */
export function TrustPage({ copy, locale }: { copy: TrustPageCopy; locale: Locale }) {
  return (
    <Scene
      theme={worlds.bone}
      as="div"
      atmosphere={{ light: 'side', grid: 'hidden', texture: 'grain', vignette: false }}
      className={styles.scene}
    >
      <Grid className={styles.grid}>
        <div className={styles.intro}>
          <p className="t-label muted">{copy.eyebrow}</p>
          <h1 className={`t-heading-1 ${styles.title}`}>{copy.title}</h1>
          <p className={`t-lead ${styles.lead}`}>{copy.lead}</p>
          <p className="t-small muted">{copy.updated}</p>
        </div>
        {copy.sections.map((section, index) => {
          const id = `section-${index + 1}`
          return (
            <section key={section.heading} aria-labelledby={id} className={styles.section}>
              <Rule className={styles.rule} decorative />
              <h2 id={id} className={`t-heading-3 ${styles.heading}`}>
                {section.heading}
              </h2>
              <div className={`prose ${styles.body}`}>
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="t-body-l">
                    {paragraph}
                  </p>
                ))}
                {section.list ? (
                  <ul className={styles.list}>
                    {section.list.map((item) => (
                      <li key={item} className="t-body-l">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {section.action ? (
                  <p>
                    <Link
                      href={trustHref(locale, section.action.page)}
                      className={`t-action ${styles.action}`}
                    >
                      <span>{section.action.label}</span>
                      <Arrow />
                    </Link>
                  </p>
                ) : null}
              </div>
            </section>
          )
        })}
      </Grid>
    </Scene>
  )
}
