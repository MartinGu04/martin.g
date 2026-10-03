import type { ProjectTheme } from '@/content/schema'

/**
 * The admin's register: the brand's near-black base and a raised graphite, the bone text,
 * and the warm amber the public Contact thread carries (accent: new leads and the primary
 * action). accent2, a quiet sage, marks won leads. Contrast is checked by themeIssues() in
 * tests/unit/admin.test.ts. Status is never shown by color alone: every badge has a label
 * and its own glyph.
 */
export const adminTheme: ProjectTheme = {
  scheme: 'dark',
  colors: {
    surface0: '#0b0b0c',
    surface1: '#161618',
    text: '#f5f3ee',
    textMuted: '#b3b1ac',
    accent: '#d9a35b',
    accent2: '#a9c49b',
    light: '#fff4e6',
  },
}
