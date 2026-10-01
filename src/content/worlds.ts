import type { ProjectTheme } from './schema'

/*
 * The worlds the homepage moves through. MARTIN.G itself is the root world (tokens.css);
 * these override color, light, texture and atmosphere inside a <Scene>, never the grammar.
 *
 * ON uses its real brand values, sampled from the live site (cream, bordeaux, warm black,
 * blush, deep bordeaux); olive stays as the approved Phase 3 detail color. The המחלבה
 * world (id mi-ma-mo) keeps its technical register. Neither is attached to the project
 * entries yet: themed project pages are part of the Phase 5 case studies.
 */
export const worlds = {
  /** ON: cream, bordeaux, olive and warm black; soft window light and paper texture. */
  on: {
    scheme: 'light',
    colors: {
      surface0: '#f6f0e5',
      surface1: '#f1e1d5',
      text: '#231a16',
      textMuted: '#5b4e47',
      accent: '#6d1f2d',
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
      surface0: '#501320',
      surface1: '#5a1a23',
      text: '#f3eadc',
      textMuted: '#d8c3b3',
      accent: '#c9c08a',
      light: '#ffe9d2',
      shade: '#1d0a0d',
    },
    atmosphere: { light: 'pool', grid: 'hidden', texture: 'paper', marks: false, vignette: true },
  },
  /** המחלבה (id mi-ma-mo): darker, cooler, structured; the grid is drawn, the product is the imagery. */
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
   * Restricted Work: a premium restricted archive. A slightly deeper, faintly cool graphite
   * than the brand's own, flat and monochrome: no light, no texture, a fading trace of the
   * grid and a soft vignette for depth. No classified or military visual language.
   */
  confidential: {
    scheme: 'dark',
    colors: {
      surface0: '#111214',
      surface1: '#17181b',
      text: '#ecebe8',
      textMuted: '#a9a8a4',
    },
    atmosphere: { light: 'none', grid: 'fade', texture: 'none', marks: false, vignette: true },
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
