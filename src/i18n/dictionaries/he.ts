import type { ReviewStatus } from '../config'
import type { Dictionary } from './en'

/**
 * Hebrew production copy reviewed and approved by Martin.
 * It is not approved production copy: Martin reviews and approves all Hebrew,
 * and production builds refuse draft copy (src/i18n/release-gate.ts).
 */
export const heReview: ReviewStatus = 'approved'

export const he: Dictionary = {
  site: {
    name: 'MARTIN.G',
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
    confidentialTitle: 'עבודות חסויות נבחרות',
    confidentialNote: 'פרטים מזהים הושמטו במכוון.',
    viewProject: 'לפרויקט',
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
