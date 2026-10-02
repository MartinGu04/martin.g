import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale, localeMeta, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/get-dictionary'
import { getProjectSequence, getPublicProject, getPublicProjects } from '@/content/registry'
import { formatYears, resolvePublicSummary } from '@/content/resolve'
import type { PublicProject } from '@/content/schema'
import { onMedia } from '@/content/projects/on'
import { miMaMoMedia } from '@/content/projects/mi-ma-mo'
import { localeAlternates } from '@/lib/site'
import { Grid } from '@/components/layout/Grid'
import { Eyebrow } from '@/components/type/Eyebrow'
import { Ltr } from '@/components/type/Ltr'
import { Name } from '@/components/type/Name'
import { MediaFrame } from '@/components/media/MediaFrame'
import { ThemeScope } from '@/components/theme/ThemeScope'
import { ProjectMedia } from '@/components/project/ProjectMedia'
import { LiveSiteLink } from '@/components/home/LiveSiteLink'
import { OnCaseStudy } from '@/components/case-study/on/OnCaseStudy'
import { MiMaMoCaseStudy } from '@/components/case-study/mi-ma-mo/MiMaMoCaseStudy'
import { showcaseCopy } from '@/i18n/dictionaries/showcase'
import { caseOnCopy } from '@/i18n/dictionaries/case-on'
import { caseMiMaMoCopy } from '@/i18n/dictionaries/case-mi-ma-mo'
import styles from './page.module.css'

/** Only public, published projects are built. Anything else is a 404, never a hidden page. */
export const dynamicParams = false

export function generateStaticParams() {
  return getPublicProjects().map((project) => ({ slug: project.id }))
}

/**
 * Projects with a composed case study (Phase 5): its metadata and its social image. Each
 * world tells its story its own way, so a case study is a dedicated composition of shared
 * case-study primitives, not a block template (dispatched in the page below). Projects
 * without one keep the media page below.
 */
const caseStudies = {
  on: {
    seo: (locale: Locale) => caseOnCopy[locale].seo,
    image: onMedia.siteHome,
  },
  'mi-ma-mo': {
    seo: (locale: Locale) => caseMiMaMoCopy[locale].seo,
    image: miMaMoMedia.dashboardFull,
  },
} as const

function hasCaseStudy(id: string): id is keyof typeof caseStudies {
  return id in caseStudies
}

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/work/[slug]'>): Promise<Metadata> {
  const { locale, slug } = await params
  const project = getPublicProject(slug)
  if (!isLocale(locale) || !project) return {}
  const alternates = localeAlternates(locale, `/work/${project.id}`)
  if (!hasCaseStudy(project.id)) {
    return {
      title: project.seo.title[locale],
      description: project.seo.description[locale],
      alternates,
    }
  }
  const { seo, image } = caseStudies[project.id]
  const { title, description } = seo(locale)
  const dict = getDictionary(locale)
  return {
    title,
    description,
    alternates,
    // The layout's Open Graph block is replaced, not merged, so it is restated here.
    openGraph: {
      title,
      description,
      siteName: dict.site.name,
      locale: localeMeta[locale].ogLocale,
      type: 'article',
      url: `/${locale}/work/${project.id}`,
      images: [
        {
          url: image.src.src,
          width: image.src.width,
          height: image.src.height,
          alt: image.alt[locale],
        },
      ],
    },
  }
}

export default async function ProjectPage({ params }: PageProps<'/[locale]/work/[slug]'>) {
  const { locale, slug } = await params
  const project = getPublicProject(slug)
  if (!isLocale(locale) || !project) notFound()
  const dict = getDictionary(locale)
  const showcase = showcaseCopy[locale]

  if (hasCaseStudy(project.id)) {
    // The public sequence numbers the work (01 ON, 02 המחלבה) and names the next world.
    const sequence = getProjectSequence().flatMap(({ project: p, number }) =>
      p.visibility === 'public' ? [{ number, ...resolvePublicSummary(p, locale, dict) }] : [],
    )
    const index = sequence.findIndex((p) => p.id === project.id)
    const current = sequence[index]
    if (!current) throw new Error(`No public sequence entry for ${project.id}.`)

    if (project.id === 'mi-ma-mo') {
      // The last public world: its end names the work that follows (Defense Systems)
      // without a route into it, and leads back to all of the work.
      return (
        <article>
          <MiMaMoCaseStudy
            locale={locale}
            dict={dict}
            showcase={showcase}
            copy={caseMiMaMoCopy[locale]}
            project={current}
          />
        </article>
      )
    }

    const next = sequence[(index + 1) % sequence.length]
    if (!next || next.id === current.id)
      throw new Error('The ON case study expects a next public project.')
    return (
      <article>
        <OnCaseStudy
          locale={locale}
          dict={dict}
          showcase={showcase}
          copy={caseOnCopy[locale]}
          project={current}
          next={next}
        />
      </article>
    )
  }

  return <MediaPage project={project} locale={locale} />
}

/**
 * The project page before its case study: header, the live site when there is one, the
 * real cover, and the project's media in order with short captions. Every public project
 * has a composed case study since Phase 5B; a new public project starts here.
 */
function MediaPage({ project, locale }: { project: PublicProject; locale: Locale }) {
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
