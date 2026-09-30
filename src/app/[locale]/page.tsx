import { notFound } from 'next/navigation'
import { isLocale } from '@/i18n/config'
import { getDictionary } from '@/i18n/get-dictionary'
import { getProjectSequence } from '@/content/registry'
import { resolveConfidentialSummary, resolvePublicSummary } from '@/content/resolve'
import { Grid } from '@/components/layout/Grid'
import { SectionHeading } from '@/components/type/SectionHeading'
import { IndexNumber } from '@/components/type/IndexNumber'
import { Ltr } from '@/components/type/Ltr'
import { HeroPlaceholder } from '@/components/hero/HeroPlaceholder'
import { ProjectIndex } from '@/components/project/ProjectIndex'
import { AbstractCover } from '@/components/project/AbstractCover'
import { Reveal } from '@/components/motion/Reveal'
import { Scene } from '@/components/scene/Scene'
import { DepthType } from '@/components/scene/DepthType'
import { confidentialWorld } from '@/content/worlds'
import styles from './page.module.css'

/**
 * Foundation home in the Cinematic Hybrid+ language: a sequence of scenes built from real,
 * approved content. Not the final home experience (hero motion, project showcases and
 * their worlds come in later phases).
 */
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

      <Scene
        id="work"
        aria-labelledby="work-title"
        atmosphere={{ light: 'pool', grid: 'fade', texture: 'grain' }}
      >
        <DepthType variant="index">01</DepthType>
        <Grid>
          <SectionHeading id="work-title" index="01" label={dict.work.selectedTitle} />
          <ProjectIndex projects={work} />
        </Grid>
      </Scene>

      {/* Confidential work is its own restrained, monochrome world: a hard cut, no light. */}
      <Scene theme={confidentialWorld} aria-labelledby="confidential-title">
        <Grid>
          <SectionHeading id="confidential-title" label={dict.work.confidentialTitle} />
          <p className={`col-aside t-small muted ${styles.note}`}>{dict.work.confidentialNote}</p>
          {/* No links, no media, no routes: sanitized summaries only. */}
          <ul role="list" className={`col-main ${styles.confidential}`}>
            {confidential.map((project, i) => (
              <Reveal as="li" key={project.id} order={i} className={styles.item}>
                <AbstractCover pattern={project.pattern} />
                <IndexNumber value={project.number} className="t-label muted" />
                <h3 className="t-heading-3">{project.title}</h3>
                <p className="t-body">{project.summary}</p>
                <p className="t-small muted">
                  {project.disciplines.join(' · ')}
                  {project.years ? (
                    <>
                      {' · '}
                      <Ltr>{project.years}</Ltr>
                    </>
                  ) : null}
                </p>
              </Reveal>
            ))}
          </ul>
        </Grid>
      </Scene>
    </>
  )
}
