/*
 * QA-ONLY COPY for the temporary art-direction concepts. Not production copy, never rendered
 * in production (same gate as /system), outside the dictionaries and the release gate.
 * Production copy shown in the concepts (positioning, principle, project titles and
 * summaries) comes from the approved dictionaries and project content.
 */
export type ConceptKey = 'a' | 'b' | 'c'

export const conceptKeys: readonly ConceptKey[] = ['a', 'b', 'c']

export const conceptCopy = {
  index: {
    title: { en: 'Art-direction concepts', he: 'כיווני ארט דיירקשן' },
    note: {
      en: 'Temporary review routes. Preview builds only. Not a final design.',
      he: 'מסלולי סקירה זמניים. בסביבות תצוגה מקדימה בלבד. לא עיצוב סופי.',
    },
  },
  names: {
    a: { en: 'Direction A · Monumental / Product Launch', he: 'כיוון A · מונומנטלי / השקת מוצר' },
    b: { en: 'Direction B · Industrial / Atmospheric', he: 'כיוון B · תעשייתי / אטמוספרי' },
    c: { en: 'Direction C · Cinematic Hybrid', he: 'כיוון C · היברידי קולנועי' },
  },
  scenes: {
    hero: { en: 'Hero composition', he: 'קומפוזיציית פתיחה' },
    scale: { en: 'Scale', he: 'קנה מידה' },
    type: { en: 'Typography hierarchy', he: 'היררכיה טיפוגרפית' },
    surface: { en: 'Project surface and transition', he: 'משטח פרויקט ומעבר' },
    material: { en: 'Background, grid and depth', he: 'רקע, גריד ועומק' },
  },
  roles: {
    hero: { en: 'Hero', he: 'פתיחה' },
    statement: { en: 'Section statement', he: 'הצהרת חלק' },
    project: { en: 'Project title', he: 'כותרת פרויקט' },
    body: { en: 'Body', he: 'גוף' },
    meta: { en: 'Metadata', he: 'מטא-דאטה' },
    micro: { en: 'Micro label', he: 'תווית זעירה' },
  },
  layers: {
    base: { en: 'Base tone', he: 'גוון בסיס' },
    light: { en: 'Light field', he: 'שדה אור' },
    grain: { en: 'Grain', he: 'גרעיניות' },
    vignette: { en: 'Vignette', he: 'ויניט' },
    grid: { en: 'Grid', he: 'גריד' },
  },
} as const
