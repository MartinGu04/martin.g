import type { Locale } from '@/i18n/config'
import type { OnCaseCopy, OnSwatchKey } from '@/i18n/dictionaries/case-on'
import { onCrops, onMedia } from '@/content/projects/on'
import { thread, worlds } from '@/content/worlds'
import type { HexColor } from '@/content/schema'
import type { StyleWithVars } from '@/lib/css'
import { Grid } from '@/components/layout/Grid'
import { Ltr } from '@/components/type/Ltr'
import { MediaFrame } from '@/components/media/MediaFrame'
import { Reveal } from '@/components/motion/Reveal'
import { Scene } from '@/components/scene/Scene'
import { ThemeScope } from '@/components/theme/ThemeScope'
import { ChapterHeading } from '../Chapter'
import type { ChapterLink } from '../ChapterIndex'
import { Crop } from '../Crop'
import styles from './OnDirection.module.css'

/** The palette as the live site and the monogram use it (src/content/worlds.ts). */
const swatches = [
  ['cream', worlds.on.colors.surface0],
  ['blush', worlds.on.colors.surface1],
  ['bordeaux', worlds.on.colors.accent],
  ['wine', worlds.onBordeaux.colors.surface0],
  ['gold', thread.on],
  ['ink', worlds.on.colors.text],
] as const satisfies readonly (readonly [OnSwatchKey, HexColor])[]

function PlateLabel({ label, note }: { label: string; note: string }) {
  return (
    <figcaption className={styles.plateLabel}>
      <span className={`t-label ${styles.plateName}`}>{label}</span>
      <span className="t-small muted">{note}</span>
    </figcaption>
  )
}

/**
 * 03 Direction, as an editorial brand book rather than UI documentation: the materials the
 * identity is made of, each on its own plate with a name and one line. The monogram on
 * the wine it lives on, the palette as swatches, the type as the site sets it, a real
 * photograph and the arch. All real material; the swatches are the sampled values.
 */
export function OnDirection({
  locale,
  copy,
  chapter,
}: {
  locale: Locale
  copy: OnCaseCopy['direction']
  chapter: ChapterLink
}) {
  return (
    <Scene
      theme={worlds.on}
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
          {copy.heading}
        </ChapterHeading>
        <p className={`t-body-l ${styles.intro}`}>{copy.intro}</p>

        <figure className={styles.monogram}>
          <ThemeScope theme={worlds.onBordeaux} className={styles.monogramPlate}>
            <MediaFrame
              media={onMedia.monogram}
              locale={locale}
              sizes="(width >= 75rem) 34vw, 70vw"
            />
          </ThemeScope>
          <PlateLabel {...copy.monogram} />
        </figure>

        <figure className={styles.palette}>
          <ul role="list" className={styles.swatches}>
            {swatches.map(([key, hex]) => (
              <li key={key} className={styles.swatch}>
                <span
                  className={styles.chip}
                  style={{ '--chip': hex } as StyleWithVars}
                  aria-hidden="true"
                />
                <span className="t-body">{copy.palette.swatches[key]}</span>
                <span className={`t-micro t-numeric muted ${styles.hex}`}>
                  <Ltr>{hex.toUpperCase()}</Ltr>
                </span>
              </li>
            ))}
          </ul>
          <PlateLabel label={copy.palette.label} note={copy.palette.note} />
        </figure>

        <Reveal as="figure" className={styles.type}>
          <div className={styles.typeSet}>
            <Crop
              crop={onCrops.headline}
              locale={locale}
              width={{ base: 0.9, md: 0.6, lg: 0.55 }}
              className={styles.headline}
            />
            <Crop
              crop={onCrops.lockup}
              locale={locale}
              width={{ base: 0.6, md: 0.3, lg: 0.2 }}
              className={styles.lockup}
            />
          </div>
          <PlateLabel {...copy.type} />
        </Reveal>

        <figure className={styles.photo}>
          <MediaFrame
            media={onMedia.patisserie}
            locale={locale}
            sizes="(width >= 75rem) 34vw, (width >= 48rem) 50vw, 100vw"
          />
          <PlateLabel {...copy.photography} />
        </figure>

        <figure className={styles.arch}>
          <Crop crop={onCrops.arch} locale={locale} width={{ base: 0.8, md: 0.4, lg: 0.28 }} />
          <PlateLabel {...copy.shape} />
        </figure>
      </Grid>
    </Scene>
  )
}
