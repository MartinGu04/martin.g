import type { ProjectTheme } from '@/content/schema'

/** Synthetic QA palettes that exercise ThemeScope. Not project themes. */
export const qaThemes = {
  inverse: {
    scheme: 'light',
    colors: { surface0: '#f1f0ec', surface1: '#e7e5df', text: '#111111', textMuted: '#595959' },
  },
  tinted: {
    scheme: 'dark',
    colors: {
      surface0: '#121417',
      surface1: '#1a1d21',
      text: '#eceef0',
      textMuted: '#9aa1a8',
      accent: '#c9b27c',
      accent2: '#86aaa6',
    },
  },
} as const satisfies Record<string, ProjectTheme>
