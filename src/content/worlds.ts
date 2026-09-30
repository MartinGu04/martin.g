import type { ProjectTheme } from './schema'

/*
 * The worlds the homepage moves through. MARTIN.G itself is the root world (tokens.css);
 * these override color, light, texture and atmosphere inside a <Scene>, never the grammar.
 *
 * PROVISIONAL: the ON and mi-ma-mo hex values follow each project's visual direction but
 * are stand-ins until the brand palettes are supplied. They are therefore not attached to
 * the project entries (which would also theme the project pages) yet.
 */
export const worlds = {
  /** ON: cream, bordeaux, olive and warm black; soft window light and paper texture. */
  on: {
    scheme: 'light',
    colors: {
      surface0: '#efe7da',
      surface1: '#e6dccb',
      text: '#1d1613',
      textMuted: '#5b4e47',
      accent: '#6b1d2a',
      accent2: '#575a2e',
      light: '#fff8ec',
      shade: '#3d1a1e',
    },
    atmosphere: { light: 'side', grid: 'hidden', texture: 'paper', marks: false, vignette: true },
  },
  /** ON, second register: a bordeaux chapter inside the same world. */
  onBordeaux: {
    scheme: 'dark',
    colors: {
      surface0: '#4a141c',
      surface1: '#5a1a23',
      text: '#f3eadc',
      textMuted: '#d8c3b3',
      accent: '#c9c08a',
      light: '#ffe9d2',
      shade: '#1d0a0d',
    },
    atmosphere: { light: 'pool', grid: 'hidden', texture: 'paper', marks: false, vignette: true },
  },
  /** mi-ma-mo: darker, cooler, structured; the grid is drawn, data is the imagery. */
  miMaMo: {
    scheme: 'dark',
    colors: {
      surface0: '#0b0d10',
      surface1: '#13171b',
      text: '#e8ecef',
      textMuted: '#9ba5ad',
      accent: '#e2a13f',
      accent2: '#86a3b5',
      light: '#c9d5de',
      shade: '#000000',
    },
    atmosphere: { light: 'side', grid: 'visible', texture: 'dots', marks: true, vignette: true },
  },
  /**
   * Confidential work: restrained, monochrome and abstract. A flat neutral graphite with
   * no light, no texture and only a fading trace of the grid. No classified or military
   * visual language.
   */
  confidential: {
    scheme: 'dark',
    colors: {
      surface0: '#161616',
      surface1: '#1e1e1e',
      text: '#e6e6e6',
      textMuted: '#a6a6a6',
    },
    atmosphere: { light: 'none', grid: 'fade', texture: 'none', marks: false, vignette: false },
  },
} as const satisfies Record<string, ProjectTheme>
