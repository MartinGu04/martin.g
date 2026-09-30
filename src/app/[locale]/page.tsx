import Link from 'next/link'
import { notFound } from 'next/navigation'
import { isLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/get-dictionary'
import { getProjectSequence } from '@/content/registry'
import { resolveConfidentialSummary, resolvePublicSummary } from '@/content/resolve'
import { Cell, Grid } from '@/components/layout/Grid'
import { SectionHeading } from '@/components/type/SectionHeading'
import { Ltr } from '@/components/type/Ltr'
import { HeroPlaceholder } from '@/components/hero/HeroPlaceholder'
import { AbstractCover } from '@/components/project/AbstractCover'
import styles from './page.module.css'

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const dict = getDictionary(locale)
  const sequence = getProjectSequence()
  const work = sequence.flatMap(({ project, number }) =>
    project.visibility === 'public'
      ? [{ number, ...resolvePublicSummary(project, locale, dict) }]
      : [],
  )
  const confidential = sequence.flatMap(({ project, number }) =>
    project.visibility === 'confidential'
      ? [{ number, ...resolveConfidentialSummary(project, locale, dict) }]
      : [],
  )

  return (
    <>
      <HeroPlaceholder dict={dict} />

      <section id="work" aria-labelledby="work-title" className={styles.section}>
        <Grid>
          <Cell span={{ base: 4, md: 8, lg: 12 }}>
            <SectionHeading id="work-title" index="01">
              {dict.work.selectedTitle}
            </SectionHeading>
          </Cell>
        </Grid>
        <Grid as="ol" role="list" className={styles.list}>
          {work.map((project) => (
            <Cell as="li" key={project.id} span={{ base: 4, md: 8, lg: 12 }} className={styles.row}>
              <Link href={project.href} className={styles.rowLink}>
                <Cell span={{ base: 4, md: 3, lg: 5 }}>
                  <p className="label muted">
                    <Ltr>{project.number}</Ltr>
                  </p>
                  <h3 className={styles.title}>
                    <Ltr>{project.title}</Ltr>
                  </h3>
                </Cell>
                <Cell span={{ base: 4, md: 5, lg: 5 }} start={{ lg: 7 }}>
                  <p>{project.summary}</p>
                  <p className="muted">{project.disciplines.join(' · ')}</p>
                </Cell>
              </Link>
            </Cell>
          ))}
        </Grid>
      </section>

      <section aria-labelledby="confidential-title" className={styles.section}>
        <Grid>
          <Cell span={{ base: 4, md: 8, lg: 12 }}>
            <SectionHeading id="confidential-title">{dict.work.confidentialTitle}</SectionHeading>
            <p className={`muted ${styles.note}`}>{dict.work.confidentialNote}</p>
          </Cell>
        </Grid>
        {/* No links, no media, no routes: sanitized summaries only. */}
        <Grid as="ul" role="list" className={styles.list}>
          {confidential.map((project) => (
            <Cell
              as="li"
              key={project.id}
              span={{ base: 4, md: 4, lg: 6 }}
              className={styles.confidentialItem}
            >
              <AbstractCover pattern={project.pattern} />
              <p className={`label muted ${styles.confidentialNumber}`}>
                <Ltr>{project.number}</Ltr>
              </p>
              <h3 className={styles.confidentialTitle}>{project.title}</h3>
              <p>{project.summary}</p>
              <p className="muted">
                {project.disciplines.join(' · ')}
                {project.years ? (
                  <>
                    {' · '}
                    <Ltr>{project.years}</Ltr>
                  </>
                ) : null}
              </p>
            </Cell>
          ))}
        </Grid>
      </section>
    </>
  )
}
