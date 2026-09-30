import type { ProjectTheme } from '@/content/schema'

/*
 * DEMONSTRATION WORLDS for the specimen (preview builds only). They show how far a project
 * may take over the experience inside the MARTIN.G grammar. The hex values are
 * PROVISIONAL stand-ins until each project's brand palette is supplied; they are not
 * project themes and are not attached to content.
 */
export const demoWorlds = {
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
} as const satisfies Record<string, ProjectTheme>
