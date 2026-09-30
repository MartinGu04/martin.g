import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import type { ProjectTheme } from '@/content/schema'
import type { PublicProjectSummary } from '@/content/resolve'
import { Grid } from '@/components/layout/Grid'
import { GridLines } from '@/components/layout/GridLines'
import { Wordmark } from '@/components/brand/BrandMark'
import { Ltr } from '@/components/type/Ltr'
import { ThemeScope } from '@/components/theme/ThemeScope'
import { conceptCopy, type ConceptKey } from './concept-copy'
import { conceptFontVariables } from './fonts'

type Styles = Readonly<Record<string, string>>
type Project = PublicProjectSummary & { number: string }

/** The layered background. Each direction styles only the layers it uses; the rest stay unrendered via CSS. */
function Atmosphere({ s }: { s: Styles }) {
  return (
    <div className={s.atmosphere} aria-hidden="true">
      <span className={s.light} />
      <span className={s.light2} />
      <span className={s.beam} />
      <span className={s.haze} />
      <span className={s.texture} />
      <GridLines className={s.gridLines} />
      <span className={s.grain} />
      <span className={s.vignette} />
    </div>
  )
}

interface ConceptScaffoldProps {
  s: Styles
  direction: ConceptKey
  locale: Locale
  dict: Dictionary
  projects: Project[]
  /** Optional palette the project surface switches to (demonstrates ThemeScope). */
  surfaceTheme?: ProjectTheme
}

/**
 * Identical scene structure for all three directions, so the comparison is about art
 * direction, not content. TEMPORARY: review-only, preview builds only.
 */
export function ConceptScaffold({
  s,
  direction,
  locale,
  dict,
  projects,
  surfaceTheme,
}: ConceptScaffoldProps) {
  const t = (value: { en: string; he: string }) => value[locale]
  const c = conceptCopy
  const featured = projects[0]!
  const roles = [
    ['hero', dict.site.principle, s.sHero],
    ['statement', dict.site.positioning, s.sStatement],
    ['project', featured.title, s.sProject],
    ['body', featured.summary, s.sBody],
    ['meta', featured.disciplines.join(' · '), s.sMeta],
    ['micro', dict.work.selectedTitle, s.sMicro],
  ] as const

  return (
    <div className={`${conceptFontVariables} ${s.root}`} data-concept={direction}>
      <div className={s.bannerBar}>
        <Grid>
          <p className={`col-full ${s.banner}`}>{t(c.names[direction])}</p>
        </Grid>
      </div>

      {/* Scene 1: hero-style composition */}
      <section className={s.hero} aria-labelledby="concept-title">
        <Atmosphere s={s} />
        <span className={s.marks} aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <p className={s.giant} aria-hidden="true">
          {dict.site.principle}
        </p>
        <Grid className={s.heroGrid}>
          <h1 id="concept-title" className="visually-hidden">
            {t(c.names[direction])}
          </h1>
          <div className={s.wordmarkSlot}>
            <Wordmark decorative width="100%" />
          </div>
          <p className={s.statement}>{dict.site.principle}</p>
          <p className={s.support}>{dict.site.positioning}</p>
          <p className={s.cue} aria-hidden="true">
            <span className={s.cueLine} />
            {dict.a11y.scrollHint}
          </p>
        </Grid>
      </section>

      {/* Scene 2: scale */}
      <section className={s.scale} aria-labelledby="concept-scale">
        <Atmosphere s={s} />
        <p className={s.bigIndex} aria-hidden="true">
          <Ltr>01</Ltr>
        </p>
        <Grid className={s.scaleGrid}>
          <h2 id="concept-scale" className={s.scaleLabel}>
            <Ltr>01</Ltr>
            <span aria-hidden="true"> / </span>
            {dict.work.selectedTitle}
          </h2>
          <ol role="list" className={s.lineup}>
            {projects.map((project) => (
              <li key={project.id} className={s.lineupItem}>
                <span className={s.lineupIndex}>
                  <Ltr>{project.number}</Ltr>
                </span>
                <span className={s.lineupTitle}>
                  <Ltr>{project.title}</Ltr>
                </span>
                <span className={s.lineupSummary}>{project.summary}</span>
                <span className={s.lineupMeta}>{project.disciplines.join(' · ')}</span>
              </li>
            ))}
          </ol>
        </Grid>
      </section>

      {/* Scene 3: typography hierarchy */}
      <section className={s.type} aria-labelledby="concept-type">
        <Grid className={s.typeGrid}>
          <h2 id="concept-type" className={s.sceneLabel}>
            {t(c.scenes.type)}
          </h2>
          {roles.map(([role, sample, cls]) => (
            <div key={role} className={s.typeRow}>
              <p className={s.roleName}>{t(c.roles[role])}</p>
              <p className={cls}>{role === 'project' ? <Ltr>{sample}</Ltr> : sample}</p>
            </div>
          ))}
        </Grid>
      </section>

      {/* Scene 4: project surface and transition */}
      <section className={s.surface} aria-labelledby="concept-surface">
        <Grid>
          <h2 id="concept-surface" className={s.sceneLabel}>
            {t(c.scenes.surface)}
          </h2>
        </Grid>
        <div className={s.stage}>
          <Atmosphere s={s} />
          <ThemeScope theme={surfaceTheme} className={s.panel}>
            <Grid className={s.panelGrid}>
              <p className={s.panelIndex}>
                <Ltr>{featured.number}</Ltr>
                <span aria-hidden="true"> / </span>
                {dict.work.selectedTitle}
              </p>
              <p className={s.panelTitle}>
                <Ltr>{featured.title}</Ltr>
              </p>
              <p className={s.panelSummary}>{featured.summary}</p>
              <p className={s.panelMeta}>{featured.disciplines.join(' · ')}</p>
            </Grid>
          </ThemeScope>
        </div>
      </section>

      {/* Scene 5: background, grid and depth, deconstructed */}
      <section className={s.material} aria-labelledby="concept-material">
        <Grid>
          <h2 id="concept-material" className={s.sceneLabel}>
            {t(c.scenes.material)}
          </h2>
          <ul role="list" className={s.tiles}>
            {(['base', 'light', 'grain', 'vignette', 'grid'] as const).map((layer) => (
              <li key={layer} className={s.tile}>
                <div className={`${s.tileArt} ${s[`tile_${layer}`] ?? ''}`} aria-hidden="true">
                  {layer === 'grid' ? <GridLines className={s.tileGrid} /> : null}
                </div>
                <p className={s.tileLabel}>{t(c.layers[layer])}</p>
              </li>
            ))}
          </ul>
        </Grid>
      </section>
    </div>
  )
}
