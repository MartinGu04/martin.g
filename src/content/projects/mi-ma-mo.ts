import type { PublicProject } from '../schema'

/** Operational workforce product. Case study and media arrive in Phase 3. */
export const miMaMo: PublicProject = {
  id: 'mi-ma-mo',
  visibility: 'public',
  order: 2,
  status: 'published',
  review: { en: 'approved', he: 'approved' },
  title: { en: 'mi-ma-mo', he: 'mi-ma-mo' },
  summary: {
    en: 'An operational workforce product for scheduling, management workflows and day-to-day operations.',
    he: 'מוצר תפעולי לניהול כוח אדם: שיבוצים, תהליכי ניהול ותפעול יומיומי.',
  },
  disciplines: [
    'product-strategy',
    'product-design',
    'engineering',
    'system-design',
    'operational-workflows',
  ],
  cover: {
    kind: 'pending',
    aspectRatio: 16 / 10,
    alt: { en: 'mi-ma-mo cover image, in production.', he: 'תמונת השער של mi-ma-mo, בהפקה.' },
  },
  story: [],
  seo: {
    title: { en: 'mi-ma-mo', he: 'mi-ma-mo' },
    description: {
      en: 'mi-ma-mo: an operational workforce product for scheduling and management workflows.',
      he: 'mi-ma-mo: מוצר תפעולי לניהול כוח אדם, שיבוצים ותהליכי ניהול.',
    },
  },
}
