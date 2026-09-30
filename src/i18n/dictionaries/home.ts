import type { Localized, ReviewStatus } from '../config'

/**
 * PROPOSED homepage copy (Phase 3), awaiting Martin's review in both locales. Kept out of
 * the approved dictionaries so nothing here is approved silently: while either locale is
 * 'draft', the release gate (src/i18n/release-gate.ts) refuses a Vercel production build.
 *
 * Hebrew is a natural equivalent, not a literal translation. It avoids gendered first
 * person forms (infinitives and plural address instead), which Martin should confirm.
 */
export const homeReview: Localized<ReviewStatus> = {
  en: 'draft',
  he: 'draft',
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
        'Strategy, design and engineering in one pair of hands, so nothing is lost between them.',
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
        build: { word: 'לבנות', line: 'להנדס אותו מקצה לקצה, מוכן לשימוש אמיתי.' },
        refine: { word: 'לשפר', line: 'ללמוד מהשימוש בו, ולשפר.' },
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
        'לאתר את הבעיה ששווה לפתור, להגדיר את הפתרון המועיל, ולעצב ולבנות את המוצר מקצה לקצה.',
        'אסטרטגיה, עיצוב והנדסה באותן ידיים, כך ששום דבר לא הולך לאיבוד ביניהם.',
      ],
    },
    contact: {
      title: 'יש בעיה ששווה לפתור?',
      line: 'בואו נבנה משהו מועיל.',
    },
  },
}
