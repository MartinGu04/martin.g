/**
 * Every word on screen, in one place (no em dashes in public copy). The language system: Hebrew is the human, direct line (it leads); English is the brand
 * and structure (it supports, smaller, or stands alone as a campaign line). Never both at
 * full size, never every sentence twice. Every Hebrew line below is Martin's own wording from
 * the second-pass brief, used verbatim (none is written or translated here).
 */
export const copy = {
  idea: { he: 'הכול מתחיל מרעיון.', en: 'EVERYTHING STARTS WITH AN IDEA.' },
  structure: { he: 'מרעיון למשהו שאפשר להשתמש בו.', en: 'FROM IDEA TO PRODUCT.' },
  builds: { web: 'אתרים.', product: 'מוצרים דיגיטליים.', system: 'מערכות.' },
  needs: 'BUILT AROUND REAL NEEDS.',
  realWork: ['BUILT FOR', 'REAL WORK.'],
  outcome: { less: 'פחות להתעסק במערכת.', more: 'יותר לעשות את העבודה.', en: 'BUILT FOR PEOPLE.' },
  /** How I Work (site): Understand, Define, Design, Build. */
  process: ['UNDERSTAND.', 'DEFINE.', 'DESIGN.', 'BUILD.'],
  bridge: ['מהרעיון.', 'עד הדבר האמיתי.'],
  /** Locked campaign line. */
  endLine: 'MAKE IT REAL.',
} as const

/** Labels and data inside the rebuilt interfaces, copied from the approved screenshots. */
export const ui = {
  greeting: 'בוקר טוב, מרטין',
  next: 'הבא שלך',
  nextShift: 'אחמ״ש לילה',
  nextWhen: 'יום שני · 5 באוקטובר',
  nextHours: '07:30 – 19:30',
  withMe: 'מי איתי?',
  covered: 'הכיסוי מלא',
  source: 'מקור: Google Sheets · עודכן עכשיו',
  updated: 'עודכן עכשיו',
  weekTeam: 'צוות השבוע',
  report: 'דוח 1 למחר',
  open: 'פתיחה',
  date: 'תאריך',
  technicians: 'טכנאים',
  today: 'היום',
} as const
