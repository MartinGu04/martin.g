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
   * Confidential work: restrained, monochrome and abstract. A soft, flat neutral grey with
   * no light, no texture and only a fading trace of the grid. No classified or military
   * visual language.
   */
  confidential: {
    scheme: 'dark',
    colors: {
      surface0: '#222222',
      surface1: '#2a2a2a',
      text: '#ededed',
      textMuted: '#b4b4b4',
    },
    atmosphere: { light: 'none', grid: 'fade', texture: 'none', marks: false, vignette: false },
  },

  /*
   * MARTIN.G registers: the brand world in other light, so the page is not black from
   * beginning to end. Same grammar, same identity, different tone.
   */

  /** A lighter graphite: bridges and the closing scene. */
  graphite: {
    scheme: 'dark',
    colors: {
      surface0: '#18181a',
      surface1: '#222225',
      text: '#f5f3ee',
      textMuted: '#bcb9b3',
      light: '#fff4e6',
    },
    atmosphere: { light: 'pool', grid: 'hidden', texture: 'grain', marks: false, vignette: true },
  },
  /** Bone: the brand's own light register, for calm, readable scenes. */
  bone: {
    scheme: 'light',
    colors: {
      surface0: '#ebe8e1',
      surface1: '#e1ddd4',
      text: '#141414',
      textMuted: '#55524c',
      light: '#ffffff',
      shade: '#3a3834',
    },
    atmosphere: { light: 'side', grid: 'hidden', texture: 'grain', marks: false, vignette: false },
  },
  /** Warm: lamplight on dark wood, for the person behind the work. */
  warm: {
    scheme: 'dark',
    colors: {
      surface0: '#1b1512',
      surface1: '#251d18',
      text: '#f4ece2',
      textMuted: '#c7b8a9',
      light: '#ffd9b0',
      shade: '#000000',
    },
    atmosphere: { light: 'pool', grid: 'hidden', texture: 'grain', marks: false, vignette: true },
  },
} as const satisfies Record<string, ProjectTheme>
