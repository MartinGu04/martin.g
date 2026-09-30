import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/get-dictionary'
import { isSpecimenEnabled } from '@/lib/specimen'
import { Grid } from '@/components/layout/Grid'
import { GridLines } from '@/components/layout/GridLines'
import { Rule } from '@/components/layout/Rule'
import { SectionHeading } from '@/components/type/SectionHeading'
import { Eyebrow } from '@/components/type/Eyebrow'
import { IndexNumber } from '@/components/type/IndexNumber'
import { TextBlock } from '@/components/type/TextBlock'
import { Ltr } from '@/components/type/Ltr'
import { MediaShell } from '@/components/media/MediaShell'
import { Monogram, Wordmark } from '@/components/brand/BrandMark'
import { ThemeScope } from '@/components/theme/ThemeScope'
import { Reveal } from '@/components/motion/Reveal'
import { ProjectIndex } from '@/components/project/ProjectIndex'
import { Atmosphere } from '@/components/scene/Atmosphere'
import { confidentialWorld } from '@/content/worlds'
import type { AtmosphereSpec, ProjectTheme } from '@/content/schema'
import { specimenCopy as copy } from './specimen-copy'
import { qaThemes } from './qa-themes'
import { demoWorlds } from './world-themes'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'System',
  robots: { index: false, follow: false },
}

interface TypeRowProps {
  role: string
  sample: string
  locale: Locale
  /** Monumental roles are shown across the full frame, where they are used. */
  wide?: boolean
}

function TypeRow({ role, sample, locale, wide = false }: TypeRowProps) {
  return (
    <div className={styles.typeRow}>
      <p className={`col-aside t-micro muted ${styles.roleName}`} dir="ltr">
        {role}
      </p>
      <p className={`${wide ? 'col-full' : 'col-main'} ${role}`} lang={locale}>
        {sample}
      </p>
    </div>
  )
}

const weights = [300, 400, 500, 600, 700, 800, 900] as const

/** Every atmosphere layer on its own, in the brand world and in a light world. */
const atmosphereTiles: readonly [string, AtmosphereSpec][] = [
  ['light: shaft', { light: 'shaft', texture: 'none', vignette: false }],
  ['light: pool', { light: 'pool', texture: 'none', vignette: false }],
  ['light: side', { light: 'side', texture: 'none', vignette: false }],
  ['grid: light', { light: 'shaft', grid: 'light', texture: 'none', vignette: false }],
  ['grid: fade', { light: 'none', grid: 'fade', texture: 'none', vignette: false }],
  ['grid: visible', { light: 'none', grid: 'visible', texture: 'none', vignette: false }],
  ['texture: grain', { light: 'none', texture: 'grain', vignette: false }],
  ['texture: paper', { light: 'none', texture: 'paper', vignette: false }],
  ['texture: dots', { light: 'none', texture: 'dots', vignette: false }],
  ['vignette', { light: 'none', texture: 'none', vignette: true }],
  ['marks', { light: 'none', texture: 'none', vignette: false, marks: true }],
  ['brand default', {}],
]

export default async function SystemSpecimenPage({ params }: PageProps<'/[locale]/system'>) {
  const { locale } = await params
  if (!isLocale(locale) || !isSpecimenEnabled()) notFound()
  const dict = getDictionary(locale)
  const t = (value: { en: string; he: string }) => value[locale]
  const s = copy.sample
  const worldBands: [ProjectTheme | undefined, string][] = [
    [undefined, t(copy.worlds.brand)],
    [demoWorlds.on, t(copy.worlds.on)],
    [demoWorlds.onBordeaux, t(copy.worlds.onBordeaux)],
    [demoWorlds.miMaMo, t(copy.worlds.miMaMo)],
    [confidentialWorld, t(copy.worlds.confidential)],
    [qaThemes.inverse, t(copy.themes.inverse)],
    [qaThemes.tinted, t(copy.themes.tinted)],
  ]

  return (
    <div className={styles.page}>
      <Grid className="section-sm">
        <Eyebrow className="col-full">{t(copy.note)}</Eyebrow>
        <h1 className={`col-full t-display ${styles.pageTitle}`}>{t(copy.title)}</h1>
      </Grid>

      {/* Typography */}
      <Grid as="section" aria-labelledby="type-title" className="section-sm">
        <SectionHeading id="type-title" index="01" label={t(copy.sections.type)} />
        <TypeRow role="t-hero" sample={t(s.display)} locale={locale} wide />
        <TypeRow role="t-display-xl" sample={t(s.display)} locale={locale} wide />
        <TypeRow role="t-display" sample={t(s.display)} locale={locale} />
        <TypeRow role="t-heading-1" sample={t(s.heading)} locale={locale} />
        <TypeRow role="t-heading-2" sample={t(s.heading)} locale={locale} />
        <TypeRow role="t-heading-3" sample={t(s.heading)} locale={locale} />
        <TypeRow role="t-lead" sample={t(s.lead)} locale={locale} />
        <TypeRow role="t-body" sample={t(s.body)} locale={locale} />
        <TypeRow role="t-small" sample={t(s.body)} locale={locale} />
        <TypeRow role="t-label" sample={t(s.label)} locale={locale} />
        <TypeRow role="t-micro" sample={t(s.label)} locale={locale} />
        <div className={styles.typeRow}>
          <p className={`col-aside t-micro muted ${styles.roleName}`} dir="ltr">
            t-numeric
          </p>
          <p className="col-main t-heading-1 t-numeric">
            <Ltr>01 02 03 04 · 2024–2026 · 12 / 8 / 4</Ltr>
          </p>
        </div>
        <div className={styles.typeRow}>
          <p className={`col-aside t-micro muted ${styles.roleName}`}>{t(copy.weights)}</p>
          <div className={`col-main ${styles.weights}`}>
            {weights.map((weight) => (
              <p key={weight} className={styles.weight} style={{ fontWeight: weight }}>
                <span lang="en" dir="ltr">
                  Aa
                </span>
                <span lang="he" dir="rtl">
                  אב
                </span>
                <span className="t-micro muted t-numeric">{weight}</span>
              </p>
            ))}
          </div>
        </div>
      </Grid>

      {/* Grid */}
      <section aria-labelledby="grid-title" className={`section-sm ${styles.gridDemo}`}>
        <GridLines />
        <Grid>
          <SectionHeading id="grid-title" index="02" label={t(copy.sections.grid)} />
          {copy.placements.map((placement) => (
            <div key={placement} className={`${placement} ${styles.placement}`} dir="ltr">
              <span className="t-micro">.{placement}</span>
            </div>
          ))}
        </Grid>
      </section>

      {/* Primitives */}
      <Grid as="section" aria-labelledby="primitives-title" className="section-sm">
        <SectionHeading
          id="primitives-title"
          index="03"
          label={t(copy.sections.primitives)}
          title={t(s.heading)}
          intro={t(s.lead)}
        />
        <div className="col-aside stack stack-sm">
          <Eyebrow index="01">{t(s.label)}</Eyebrow>
          <IndexNumber value="02" size="display" />
        </div>
        <TextBlock className="col-text">
          <p>{t(s.body)}</p>
          <p>
            {t(s.body)} <a href={`/${locale}`}>{dict.site.name}</a>
          </p>
        </TextBlock>
        <Rule className="col-full" />
        <Rule className="col-full" weight="strong" />
        <MediaShell aspectRatio={16 / 9} className="col-content" caption={t(s.lead)} />
        <MediaShell aspectRatio={4 / 5} className="col-aside" />
        <div className={`col-main surface-outline ${styles.surfaceDemo}`}>
          <p className="t-small">.surface-outline</p>
        </div>
      </Grid>

      {/* Brand marks */}
      <Grid as="section" aria-labelledby="marks-title" className="section-sm">
        <SectionHeading id="marks-title" index="04" label={t(copy.sections.marks)} />
        <div className={`col-full ${styles.marks}`}>
          {['0.5rem', '1.5rem', '2.5rem'].map((height) => (
            <figure key={height} className={styles.markFigure}>
              <div className={styles.clearSpace}>
                <Wordmark height={height} withClearSpace />
              </div>
              <figcaption className="t-micro muted" dir="ltr">
                wordmark {height}
              </figcaption>
            </figure>
          ))}
          {['0.5rem', '1.5rem', '3rem'].map((height) => (
            <figure key={`mg-${height}`} className={styles.markFigure}>
              <div className={styles.clearSpace}>
                <Monogram height={height} withClearSpace />
              </div>
              <figcaption className="t-micro muted" dir="ltr">
                monogram {height}
              </figcaption>
            </figure>
          ))}
        </div>
      </Grid>

      {/* Atmosphere */}
      <Grid as="section" aria-labelledby="atmosphere-title" className="section-sm">
        <SectionHeading id="atmosphere-title" index="05" label={t(copy.sections.atmosphere)} />
        {([undefined, demoWorlds.on] as const).map((theme, row) => (
          <ThemeScope key={row} theme={theme} className={`col-full ${styles.tileRow}`}>
            <ul role="list" className={styles.tiles}>
              {atmosphereTiles.map(([name, spec]) => (
                <li key={name} className={styles.tile}>
                  <div className={styles.tileArt}>
                    <Atmosphere {...spec} />
                  </div>
                  <p className="t-micro" dir="ltr">
                    {name}
                  </p>
                </li>
              ))}
            </ul>
          </ThemeScope>
        ))}
      </Grid>

      {/* Worlds */}
      <section aria-labelledby="themes-title" className="section-sm">
        <Grid>
          <SectionHeading id="themes-title" index="06" label={t(copy.sections.themes)} />
          <p className="col-main t-body">
            <a href={`/${locale}/system/scenes`}>{t(copy.worlds.scenesLink)}</a>
          </p>
        </Grid>
        {worldBands.map(([theme, name], i) => (
          <ThemeScope key={name} theme={theme} className={styles.themeBand}>
            <Atmosphere {...theme?.atmosphere} />
            <Grid className={styles.themeGrid}>
              <Eyebrow className="col-aside" index={String(i + 1).padStart(2, '0')}>
                {name}
              </Eyebrow>
              <div className="col-main stack stack-sm">
                <p className="t-display">{t(s.display)}</p>
                <p className="t-body muted measure-text">{t(s.body)}</p>
                <p className={`t-label ${styles.accents}`}>
                  <span style={{ color: 'var(--accent)' }}>accent</span>
                  <span style={{ color: 'var(--accent-2)' }}>accent-2</span>
                  <a href={`/${locale}`}>{dict.site.name}</a>
                </p>
              </div>
            </Grid>
          </ThemeScope>
        ))}
      </section>

      {/* Motion */}
      <Grid as="section" aria-labelledby="motion-title" className="section-sm">
        <SectionHeading id="motion-title" index="07" label={t(copy.sections.motion)} />
        {(['fade', 'rise', 'scale', 'mask'] as const).map((variant, i) => (
          <Reveal
            key={variant}
            variant={variant}
            order={i}
            className={`surface ${styles.motionTile}`}
          >
            <p className="t-label">{t(copy.motion[variant])}</p>
          </Reveal>
        ))}
        <div className={`col-full ${styles.parallaxFrame}`}>
          <div data-parallax className={styles.parallaxLayer}>
            <p className="t-label">{t(copy.motion.parallax)}</p>
          </div>
        </div>
      </Grid>

      {/* Long strings */}
      <Grid as="section" aria-labelledby="stress-title" className="section-sm">
        <SectionHeading
          id="stress-title"
          index="08"
          label={t(copy.sections.stress)}
          title={t(copy.stress.longTitle)}
        />
        <p className="col-main t-heading-2">{t(copy.stress.longWord)}</p>
        <TextBlock className="col-text">
          <p>{t(copy.stress.longParagraph)}</p>
        </TextBlock>
        <ProjectIndex
          projects={[
            {
              id: 'qa-long',
              number: '99',
              href: `/${locale}/work/on`,
              title: t(copy.stress.longTitle),
              summary: t(copy.stress.longParagraph),
              disciplines: [t(s.label), t(copy.sections.primitives), t(copy.sections.motion)],
            },
          ]}
        />
      </Grid>
    </div>
  )
}
