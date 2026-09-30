import type { ReviewStatus } from '../config'

/** English is the key source of truth. Every other dictionary must match this shape. */
export const enReview: ReviewStatus = 'approved'

export const en = {
  site: {
    name: 'MARTIN.G',
    positioning: 'Digital products, systems & experiences.',
    principle: 'From problem to product.',
    description:
      'Digital products, systems & experiences by Martin Gusin. From problem to product.',
  },
  a11y: {
    skipToContent: 'Skip to content',
    primaryNav: 'Primary',
    homeLink: 'MARTIN.G, home',
    switchLanguage: 'Switch language',
    scrollHint: 'Scroll to explore',
  },
  nav: {
    work: 'Work',
  },
  work: {
    selectedTitle: 'Selected Work',
    confidentialTitle: 'Restricted Work',
    confidentialNote: 'Identifying details are withheld by design.',
    viewProject: 'View project',
  },
  project: {
    years: 'Years',
    disciplines: 'Disciplines',
    inPreparation: 'The full case study is in preparation.',
    present: 'Present',
  },
  disciplines: {
    'product-strategy': 'Product strategy',
    'product-design': 'Product design',
    'experience-design': 'Experience design',
    'brand-experience': 'Brand experience',
    engineering: 'Engineering',
    'system-design': 'System design',
    'operational-workflows': 'Operational workflows',
  },
  footer: {
    copyright: '© {year} Martin Gusin',
  },
} as const

type Widen<T> = T extends string ? string : { readonly [K in keyof T]: Widen<T[K]> }

export type Dictionary = Widen<typeof en>
export type DisciplineKey = keyof typeof en.disciplines
