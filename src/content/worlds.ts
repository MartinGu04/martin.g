import type { ProjectTheme } from './schema'

/*
 * The worlds the homepage moves through. MARTIN.G itself is the root world (tokens.css);
 * these override color, light, texture and atmosphere inside a <Scene>, never the grammar.
 *
 * ON uses its real brand values, sampled from the live site (cream, bordeaux, warm black,
 * blush, deep bordeaux); olive stays as the approved Phase 3 detail color. The המחלבה
 * world (id mi-ma-mo) keeps its technical register. The ON case study (Phase 5) moves
 * through the ON registers chapter by chapter (src/components/case-study/on).
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
  /**
   * ON, the screening room: the bordeaux taken almost to black, for the brand film. The
   * picture is the light; cream text, the monogram's gold as the one accent.
   */
  onNight: {
    scheme: 'dark',
    colors: {
      surface0: '#170a0d',
      surface1: '#231116',
      text: '#f3eadc',
      textMuted: '#cdb9a9',
      accent: '#c39a5b',
      light: '#ffe2c4',
      shade: '#000000',
    },
    atmosphere: { light: 'pool', grid: 'hidden', texture: 'grain', marks: false, vignette: true },
  },
  /**
   * המחלבה (id mi-ma-mo): midnight blue, structured; the grid is drawn, the product is the
   * imagery. Values come from the real interface: its midnight ground and deep card blue,
   * its amber and its operational green ("full coverage").
   */
  miMaMo: {
    scheme: 'dark',
    colors: {
      surface0: '#0b121c',
      surface1: '#0f1d2e',
      text: '#e6edf5',
      textMuted: '#9aabbf',
      accent: '#ffac4f',
      accent2: '#3ecf8e',
      light: '#7fa6d6',
      shade: '#000000',
    },
    atmosphere: { light: 'side', grid: 'visible', texture: 'dots', marks: true, vignette: true },
  },
  /**
   * Defense Systems: gunmetal and steel with one restrained cold technical accent, flat:
   * no light, no texture, a fading trace of the grid and a soft vignette for depth. Never
   * classified, warning or dossier styling.
   */
  confidential: {
    scheme: 'dark',
    colors: {
      surface0: '#15181c',
      surface1: '#1c2026',
      text: '#eceff2',
      textMuted: '#a6aeb7',
      accent: '#7fb4cc',
    },
    atmosphere: { light: 'none', grid: 'fade', texture: 'none', marks: false, vignette: true },
  },

  /*
   * MARTIN.G registers: the brand world in other light, so the page is not black from
   * beginning to end. Same grammar, same identity, different tone.
   */

  /** A lighter graphite: bridges and the closing scene, with a restrained amber. */
  graphite: {
    scheme: 'dark',
    colors: {
      surface0: '#18181a',
      surface1: '#222225',
      text: '#f5f3ee',
      textMuted: '#bcb9b3',
      accent: '#d9a35b',
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
      accent: '#9a4a1e',
      accent2: '#56654b',
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
      accent: '#e6c8a5',
      light: '#ffd9b0',
      shade: '#000000',
    },
    atmosphere: { light: 'pool', grid: 'hidden', texture: 'grain', marks: false, vignette: true },
  },
} as const satisfies Record<string, ProjectTheme>

/**
 * The thread's color in each world, in page order (src/components/scene/Thread.tsx): a
 * scene's thread runs from the previous world's color to its own.
 */
export const thread = {
  bridge: '#f5f3ee',
  on: '#c39a5b',
  miMaMo: '#ffac4f',
  defense: '#7fb4cc',
  process: '#f5f3ee',
  capabilities: '#9a4a1e',
  about: '#e6c8a5',
  contact: '#d9a35b',
} as const satisfies Record<string, `#${string}`>
