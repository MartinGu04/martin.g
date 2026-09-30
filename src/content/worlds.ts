import type { ProjectTheme } from './schema'

/*
 * Worlds that are not tied to a single public project. Project worlds (ON, mi-ma-mo)
 * live on their project entries once their brand values are confirmed.
 */

/**
 * Confidential work: restrained, monochrome and abstract. A flat neutral graphite with
 * no light, no texture and only a fading trace of the grid. No classified or military
 * visual language.
 */
export const confidentialWorld: ProjectTheme = {
  scheme: 'dark',
  colors: {
    surface0: '#161616',
    surface1: '#1e1e1e',
    text: '#e6e6e6',
    textMuted: '#a6a6a6',
  },
  atmosphere: { light: 'none', grid: 'fade', texture: 'none', marks: false, vignette: false },
}
