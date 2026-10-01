import type { Localized, ReviewStatus } from '../config'

/**
 * Homepage copy (Phase 3), reviewed and approved by Martin in both locales. It stays in
 * its own module with its own review state: setting either locale back to 'draft' makes
 * the release gate (src/i18n/release-gate.ts) refuse a Vercel production build again.
 *
 * Hebrew is a natural equivalent, not a literal translation. It avoids gendered first
 * person forms (infinitives and plural address instead).
 */
export const homeReview: Localized<ReviewStatus> = {
  en: 'approved',
  he: 'approved',
}

export type ProcessStepKey = 'understand' | 'define' | 'design' | 'build' | 'refine'

export interface HomeCopy {
  process: {
    title: string
    /** The thought the section answers. */
    lead: string
    steps: Readonly<Record<ProcessStepKey, { word: string; line: string }>>
  }
  capabilities: { title: string; lead: string }
  about: {
    title: string
    name: string
    role: string
    /** Martin's own words: authored portfolio copy, not a testimonial. */
    quote: string
    support: string
  }
  contact: { title: string; line: string }
}

export const processOrder: readonly ProcessStepKey[] = [
  'understand',
  'define',
  'design',
  'build',
  'refine',
]

export const homeCopy: Localized<HomeCopy> = {
  en: {
    process: {
      title: 'How I Work',
      lead: 'How a problem becomes a product.',
      steps: {
        understand: { word: 'Understand', line: 'Find the real problem before the first screen.' },
        define: { word: 'Define', line: 'Decide what is worth building, and what is not.' },
        design: { word: 'Design', line: 'Shape the product around how it will really be used.' },
        build: { word: 'Build', line: 'Engineer it end to end, ready for real use.' },
        refine: { word: 'Refine', line: 'Learn from it in use, then make it better.' },
      },
    },
    capabilities: {
      title: 'Capabilities',
      lead: 'Each one proven in the work.',
    },
    about: {
      title: 'About',
      name: 'Martin Gusin',
      role: 'Product Builder',
      quote: 'I don’t start with a screen. I start with the problem.',
      support:
        'From there, I bring strategy, design and engineering together until it becomes a product that works.',
    },
    contact: {
      title: 'Have a problem worth solving?',
      line: 'Let’s build something worth using.',
    },
  },
  he: {
    process: {
      title: 'דרך העבודה',
      lead: 'איך בעיה הופכת למוצר.',
      steps: {
        understand: { word: 'להבין', line: 'למצוא את הבעיה האמיתית, לפני המסך הראשון.' },
        define: { word: 'להגדיר', line: 'להחליט מה שווה לבנות, ומה לא.' },
        design: { word: 'לעצב', line: 'להתאים את המוצר לאופן שבו ישתמשו בו באמת.' },
        build: { word: 'לבנות', line: 'להפוך את התכנון למוצר שלם, מוכן לשימוש אמיתי.' },
        refine: { word: 'לשפר', line: 'ללמוד מהשימוש האמיתי, ואז לדייק.' },
      },
    },
    capabilities: {
      title: 'יכולות',
      lead: 'כל יכולת, מוכחת בעבודה.',
    },
    about: {
      title: 'אודות',
      name: 'Martin Gusin',
      role: 'בונה מוצרים',
      quote: 'אני לא מתחיל ממסך. אני מתחיל מהבעיה.',
      support: 'משם אני מחבר אסטרטגיה, עיצוב והנדסה עד שזה הופך למוצר שעובד.',
    },
    contact: {
      title: 'יש בעיה ששווה לפתור?',
      line: 'בואו נבנה משהו ששווה להשתמש בו.',
    },
  },
}
