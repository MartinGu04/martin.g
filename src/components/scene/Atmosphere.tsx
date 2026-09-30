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
 * assistive technology. Every layer reads the enclosing scope's semantic colors (--text,
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
      <span className={styles.base} />
      {light !== 'none' ? (
        <>
          <span className={styles[light]} />
          <span className={styles.haze} />
        </>
      ) : null}
      {grid !== 'hidden' ? (
        <GridLines className={`${styles.grid} ${styles[`grid_${grid}`]}`} />
      ) : null}
      {texture !== 'none' ? <span className={styles[texture]} /> : null}
      {vignette ? <span className={styles.vignette} /> : null}
      {marks ? (
        <span className={styles.marks}>
          <i />
          <i />
          <i />
          <i />
        </span>
      ) : null}
    </div>
  )
}
