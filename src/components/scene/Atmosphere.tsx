import type { AtmosphereSpec } from '@/content/schema'
import { GridLines } from '@/components/layout/GridLines'
import styles from './Atmosphere.module.css'

/** The brand world's default: a directional shaft of warm light, fine grain, a vignette. */
export const brandAtmosphere = {
  light: 'shaft',
  grid: 'hidden',
  texture: 'grain',
  marks: false,
  vignette: true,
} as const satisfies Required<AtmosphereSpec>

interface AtmosphereProps extends AtmosphereSpec {
  className?: string
}

/**
 * The layered background of a scene: base tone, light field, haze, grid, texture,
 * vignette and optional registration marks, back to front. Decorative and hidden from
 * assistive technology. Each layer carries data-layer (base, light, haze, grid, texture,
 * vignette, marks) so a composition can move or fade one layer with its own choreography. Every layer reads the enclosing scope's semantic colors (--text,
 * --surface-*, --light, --shade), so one spec renders correctly in any world. Place it as
 * the first child of an isolated, positioned container (<Scene> does this).
 */
export function Atmosphere({
  light = brandAtmosphere.light,
  grid = brandAtmosphere.grid,
  texture = brandAtmosphere.texture,
  marks = brandAtmosphere.marks,
  vignette = brandAtmosphere.vignette,
  className,
}: AtmosphereProps) {
  return (
    <div className={[styles.atmosphere, className].filter(Boolean).join(' ')} aria-hidden="true">
      <span className={styles.base} data-layer="base" />
      {light !== 'none' ? (
        <>
          <span className={styles[light]} data-layer="light" />
          <span className={styles.haze} data-layer="haze" />
        </>
      ) : null}
      {grid !== 'hidden' ? (
        <span className={styles.gridLayer} data-layer="grid">
          <GridLines className={`${styles.grid} ${styles[`grid_${grid}`]}`} />
        </span>
      ) : null}
      {texture !== 'none' ? <span className={styles[texture]} data-layer="texture" /> : null}
      {vignette ? <span className={styles.vignette} data-layer="vignette" /> : null}
      {marks ? (
        <span className={styles.marks} data-layer="marks">
          <i />
          <i />
          <i />
          <i />
        </span>
      ) : null}
    </div>
  )
}
