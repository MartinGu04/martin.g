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
    steps: Readonly<Record<ProcessStepKey, { word: string; line: string }>>
  }
  capabilities: { title: string; lead: string }
  about: { title: string; name: string; role: string; lines: readonly string[] }
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
      title: 'How I work',
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
      lines: [
        'I find the problem worth solving, define the useful answer, and design and build the product end to end.',
        'Strategy, design and engineering carried through as one process, so nothing gets lost along the way.',
      ],
    },
    contact: {
      title: 'Have a problem worth solving?',
      line: 'Let’s build something useful.',
    },
  },
  he: {
    process: {
      title: 'דרך העבודה',
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
      lines: [
        'לזהות את הבעיה ששווה לפתור, להגדיר את הפתרון הנכון, ולעצב ולבנות את המוצר מקצה לקצה.',
        'אסטרטגיה, עיצוב והנדסה בתהליך אחד, כך ששום דבר לא הולך לאיבוד בדרך.',
      ],
    },
    contact: {
      title: 'יש בעיה ששווה לפתור?',
      line: 'בואו נבנה משהו שעובד.',
    },
  },
}
