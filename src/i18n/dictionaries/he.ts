import type { ReviewStatus } from '../config'
import type { Dictionary } from './en'

/**
 * Hebrew production copy reviewed and approved by Martin.
 * It is not approved production copy: Martin reviews and approves all Hebrew,
 * and production builds refuse draft copy (src/i18n/release-gate.ts).
 */
// Draft (Phase 8C): the Defense Systems note changed, now that one interface is shown blurred.
export const heReview: ReviewStatus = 'draft'

export const he: Dictionary = {
  site: {
    name: 'MARTIN.G',
    title: 'MARTIN.G · בניית מוצרים דיגיטליים',
    positioning: 'מוצרים דיגיטליים, מערכות וחוויות.',
    principle: 'מבעיה למוצר.',
    description: 'מוצרים דיגיטליים, מערכות וחוויות מאת Martin Gusin. מבעיה למוצר.',
  },
  a11y: {
    skipToContent: 'דילוג לתוכן',
    primaryNav: 'ראשי',
    homeLink: 'MARTIN.G, דף הבית',
    switchLanguage: 'החלפת שפה',
    scrollHint: 'גללו להמשך',
  },
  nav: {
    work: 'עבודות',
  },
  work: {
    selectedTitle: 'עבודות נבחרות',
    confidentialTitle: 'מערכות ביטחוניות',
    confidentialNote:
      'מערכות תפעוליות שנבנו לסביבה ביטחונית. פרטים מזהים הושמטו במכוון, וממשק שמוצג כאן מטושטש במלואו.',
    viewProject: 'לפרויקט',
    visitLiveSite: 'לאתר החי',
  },
  project: {
    years: 'שנים',
    disciplines: 'תחומים',
    inPreparation: 'חקר המקרה המלא נמצא בהכנה.',
    present: 'היום',
  },
  disciplines: {
    'product-strategy': 'אסטרטגיית מוצר',
    'product-design': 'עיצוב מוצר',
    'experience-design': 'עיצוב חוויה',
    'brand-experience': 'חוויית מותג',
    engineering: 'הנדסת תוכנה',
    'system-design': 'תכנון מערכות',
    'operational-workflows': 'תהליכי עבודה תפעוליים',
  },
  footer: {
    copyright: '© {year} Martin Gusin',
  },
}
