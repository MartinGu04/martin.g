import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/get-dictionary'
import { getPublicProject, getPublicProjects } from '@/content/registry'
import { formatYears } from '@/content/resolve'
import { localeAlternates } from '@/lib/site'
import { Cell, Grid } from '@/components/layout/Grid'
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
        <Cell span={{ base: 4, md: 8, lg: 8 }}>
          <h1 className={styles.title}>
            <Ltr>{project.title[locale]}</Ltr>
          </h1>
        </Cell>
        <Cell span={{ base: 4, md: 6, lg: 6 }}>
          <p className={styles.summary}>{project.summary[locale]}</p>
        </Cell>
        <Cell span={{ base: 4, md: 8, lg: 12 }}>
          <dl className={styles.facts}>
            {years ? (
              <div>
                <dt className="label muted">{dict.project.years}</dt>
                <dd>
                  <Ltr>{years}</Ltr>
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="label muted">{dict.project.disciplines}</dt>
              <dd>{project.disciplines.map((d) => dict.disciplines[d]).join(' · ')}</dd>
            </div>
          </dl>
        </Cell>
      </Grid>
      <Grid>
        <Cell span={{ base: 4, md: 8, lg: 12 }}>
          <MediaFrame media={project.cover} locale={locale} sizes="100vw" priority />
        </Cell>
        <Cell span={{ base: 4, md: 6, lg: 6 }} className={styles.note}>
          <p className="muted">{dict.project.inPreparation}</p>
        </Cell>
      </Grid>
    </ThemeScope>
  )
}
