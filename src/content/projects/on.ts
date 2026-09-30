import type { PublicProject } from '../schema'

/** Primary showcase. Case study, media and years arrive in Phase 5. */
export const on: PublicProject = {
  id: 'on',
  visibility: 'public',
  order: 1,
  status: 'published',
  review: { en: 'approved', he: 'approved' },
  title: { en: 'ON', he: 'ON' },
  summary: {
    en: 'A premium dating retreat brand and digital experience.',
    he: 'מותג ריטריט היכרויות פרימיום וחוויה דיגיטלית.',
  },
  disciplines: ['brand-experience', 'experience-design', 'product-design', 'engineering'],
  cover: {
    kind: 'pending',
    aspectRatio: 16 / 9,
    alt: { en: 'ON cover image, in production.', he: 'תמונת השער של ON, בהפקה.' },
  },
  story: [],
  seo: {
    title: { en: 'ON', he: 'ON' },
    description: {
      en: 'ON: a premium dating retreat brand and digital experience.',
      he: 'ON: מותג ריטריט היכרויות פרימיום וחוויה דיגיטלית.',
    },
  },
}
