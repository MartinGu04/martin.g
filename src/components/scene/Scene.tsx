import type { ReactNode } from 'react'
import type { AtmosphereSpec, ProjectTheme } from '@/content/schema'
import { ThemeScope } from '@/components/theme/ThemeScope'
import { Atmosphere } from './Atmosphere'
import styles from './Scene.module.css'

interface SceneProps {
  /** The world this scene belongs to. Omit for the MARTIN.G brand world. */
  theme?: ProjectTheme | undefined
  /** Atmosphere layers; defaults to the theme's own, then to the brand's. false renders none. */
  atmosphere?: AtmosphereSpec | false
  /** 'frame' fills the viewport below the header, like a film frame; 'flow' fits content. */
  size?: 'frame' | 'flow'
  /**
   * How the scene takes over from the one before it, driven by scroll (never hijacked):
   *   'wipe'  the world opens from a framed panel to full bleed (warm, emotional worlds)
   *   'split' the world opens from a center seam while its grid draws (technical worlds)
   *   'cut'   no transition (restrained worlds)
   */
  enter?: 'wipe' | 'split' | 'cut'
  as?: 'section' | 'div' | 'article'
  id?: string
  'aria-labelledby'?: string
  className?: string
  children: ReactNode
}

/**
 * The unit of the page: scene, then scene, then scene. A scene is a themed, isolated frame
 * with its own atmosphere, so a project can temporarily take over the whole experience
 * (color, light, texture) while the MARTIN.G grammar (grid, type, spacing, motion) stays
 * the same. Content goes inside a <Grid> as usual. Everything is server-rendered: the
 * first paint already shows the right world.
 */
export function Scene({
  theme,
  atmosphere,
  size = 'flow',
  enter = 'cut',
  as = 'section',
  className,
  children,
  ...rest
}: SceneProps) {
  const layers = atmosphere === false ? null : { ...theme?.atmosphere, ...atmosphere }
  const cls = [styles.scene, size === 'frame' ? styles.frame : '', className]
    .filter(Boolean)
    .join(' ')
  return (
    <ThemeScope theme={theme} as={as} className={cls} data-scene="" data-enter={enter} {...rest}>
      {layers ? <Atmosphere {...layers} /> : null}
      {children}
    </ThemeScope>
  )
}
