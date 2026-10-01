/**
 * Every word on screen, in one place. Derived from the site's own language (the principle
 * "From problem to product." and the How I Work steps); the end line is the locked campaign
 * line. No em dashes in public copy. Hebrew strings are the real interfaces' own labels.
 */
export const copy = {
  /** The principle, as one word that turns into the other (shared "PRO"). */
  problem: 'PROBLEM',
  product: 'PRODUCT',
  realWork: ['BUILT FOR', 'REAL WORK.'],
  /** How I Work (site): Understand, Define, Design, Build. */
  process: ['UNDERSTAND.', 'DEFINE.', 'DESIGN.', 'BUILD.'],
  endLine: 'MAKE IT REAL.',
  /** Quiet slates, numbered as on the site. */
  slates: {
    on: ['01', 'ON'],
    miMaMo: ['02', 'המחלבה'],
    defense: ['03 / 04', 'DEFENSE SYSTEMS'],
  },
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
