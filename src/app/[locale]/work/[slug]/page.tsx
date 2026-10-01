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
import { Name } from '@/components/type/Name'
import { MediaFrame } from '@/components/media/MediaFrame'
import { ThemeScope } from '@/components/theme/ThemeScope'
import { ProjectMedia } from '@/components/project/ProjectMedia'
import { LiveSiteLink } from '@/components/home/LiveSiteLink'
import { showcaseCopy } from '@/i18n/dictionaries/showcase'
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

/**
 * The project page before its case study (Phase 5): header, the live site when there is
 * one, the real cover, and the project's media in order with short captions.
 */
export default async function ProjectPage({ params }: PageProps<'/[locale]/work/[slug]'>) {
  const { locale, slug } = await params
  const project = getPublicProject(slug)
  if (!isLocale(locale) || !project) notFound()
  const dict = getDictionary(locale)
  const years = formatYears(project.years, dict)
  const showcase = showcaseCopy[locale]

  return (
    <ThemeScope theme={project.theme} as="article" className={styles.article}>
      <Grid className={styles.header}>
        <Eyebrow className="col-full">{dict.nav.work}</Eyebrow>
        <h1 className={`col-full t-display-xl ${styles.title}`}>
          <Name>{project.title[locale]}</Name>
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
        {project.links?.live ? (
          <LiveSiteLink
            href={project.links.live}
            label={dict.work.visitLiveSite}
            title={project.title[locale]}
            newTab={showcase.opensInNewTab}
            className="col-main"
          />
        ) : null}
      </Grid>
      <Grid>
        <MediaFrame
          media={project.cover}
          locale={locale}
          sizes="(width >= 75rem) 84vw, 100vw"
          priority
          className="col-content"
        />
      </Grid>
      <div className={styles.media}>
        <ProjectMedia story={project.story} locale={locale} showcase={showcase} />
      </div>
      <Grid>
        <p className={`col-text t-body muted ${styles.note}`}>{dict.project.inPreparation}</p>
      </Grid>
    </ThemeScope>
  )
}
