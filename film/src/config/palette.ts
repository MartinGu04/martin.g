/**
 * The film's colors, taken from the site's tokens (src/styles/tokens.css) and worlds
 * (src/content/worlds.ts). Scenes read these semantic names, never raw hex values.
 */
export const brand = {
  black: '#060606',
  graphite: '#121212',
  ink: '#F5F3EE',
  muted: '#B3B1AC',
  light: '#FFF4E6',
  line: 'rgba(255,255,255,0.10)',
  lineStrong: 'rgba(255,255,255,0.20)',
} as const

export const world = {
  /** המחלבה (id mi-ma-mo): midnight, card blue, amber, operational green. */
  miMaMo: {
    bg: '#0b121c',
    surface: '#0f1d2e',
    card: '#122236',
    text: '#e6edf5',
    muted: '#9aabbf',
    amber: '#ffac4f',
    green: '#3ecf8e',
    light: '#7fa6d6',
    line: 'rgba(160,190,230,0.12)',
  },
  /** ON: cream, bordeaux, olive, warm black, gold. */
  on: {
    cream: '#f6f0e5',
    blush: '#f1e1d5',
    ink: '#231a16',
    bordeaux: '#501320',
    wine: '#6d1f2d',
    night: '#170a0d',
    gold: '#c39a5b',
    olive: '#575a2e',
  },
  /** Defense Systems: gunmetal and steel, one cold accent. Never warning or dossier styling. */
  defense: {
    bg: '#15181c',
    surface: '#1c2026',
    text: '#eceff2',
    muted: '#a6aeb7',
    accent: '#7fb4cc',
    line: 'rgba(200,215,230,0.16)',
  },
  graphite: { bg: '#18181a', surface: '#222225', amber: '#d9a35b' },
  bone: { bg: '#ebe8e1', surface: '#e1ddd4', ink: '#141414', accent: '#9a4a1e' },
} as const
