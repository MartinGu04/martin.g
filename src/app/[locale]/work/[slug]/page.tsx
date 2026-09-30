import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/get-dictionary'
import { getPublicProject, getPublicProjects } from '@/content/registry'
import { formatYears } from '@/content/resolve'
import { localeAlternates } from '@/lib/site'
import { Grid } from '@/components/layout/Grid'
import { Eyebrow } from '@/components/type/Eyebrow'
import { Ltr } from '@/components/type/Ltr'
import { MediaFrame } from '@/components/media/MediaFrame'
import { ThemeScope } from '@/components/theme/ThemeScope'
import styles from './page.module.css'

/** Only public, published projects are built. Anything else is a 404, never a hidden page. */
export const dynamicParams = false

export function generateStaticParams() {
  return getPublicProjects().map((project) => ({ slug: project.id }))
}

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/work/[slug]'>): Promise<Metadata> {
  const { locale, slug } = await params
  const project = getPublicProject(slug)
  if (!isLocale(locale) || !project) return {}
  return {
    title: project.seo.title[locale],
    description: project.seo.description[locale],
    alternates: localeAlternates(locale, `/work/${project.id}`),
  }
}

/** FOUNDATION PLACEHOLDER: project header and cover only. The block renderer arrives in Phase 3. */
export default async function ProjectPage({ params }: PageProps<'/[locale]/work/[slug]'>) {
  const { locale, slug } = await params
  const project = getPublicProject(slug)
  if (!isLocale(locale) || !project) notFound()
  const dict = getDictionary(locale)
  const years = formatYears(project.years, dict)

  return (
    <ThemeScope theme={project.theme} as="article" className={styles.article}>
      <Grid className={styles.header}>
        <Eyebrow className="col-full">{dict.nav.work}</Eyebrow>
        <h1 className={`col-full t-display-xl ${styles.title}`}>
          <Ltr>{project.title[locale]}</Ltr>
        </h1>
        <p className="col-main t-lead measure-lead">{project.summary[locale]}</p>
        <dl className={`col-main ${styles.facts}`}>
          {years ? (
            <div>
              <dt className="t-label muted">{dict.project.years}</dt>
              <dd className="t-numeric">
                <Ltr>{years}</Ltr>
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="t-label muted">{dict.project.disciplines}</dt>
            <dd>{project.disciplines.map((d) => dict.disciplines[d]).join(' · ')}</dd>
          </div>
        </dl>
      </Grid>
      <Grid>
        <MediaFrame
          media={project.cover}
          locale={locale}
          sizes="(width >= 75rem) 84vw, 100vw"
          priority
          className="col-content"
        />
        <p className={`col-text t-body muted ${styles.note}`}>{dict.project.inPreparation}</p>
      </Grid>
    </ThemeScope>
  )
}
