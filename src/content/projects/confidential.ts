import type { ConfidentialProject } from '../schema'

/*
 * Sanitized public identities only. Real names, clients, locations, dates, team sizes,
 * feature names and screenshots must never appear in this repository, including history.
 * These entries have no route and no link; they render only in the confidential section.
 */

export const confidential01: ConfidentialProject = {
  id: 'confidential-01',
  visibility: 'confidential',
  order: 3,
  status: 'published',
  review: { en: 'draft', he: 'draft' },
  title: { en: 'Confidential Operational System', he: 'מערכת תפעולית חסויה' },
  summary: {
    en: 'Operational software developed for a security environment.',
    he: 'תוכנה תפעולית שפותחה עבור סביבת אבטחה.',
  },
  disciplines: ['system-design', 'engineering', 'operational-workflows'],
  cover: { kind: 'abstract', pattern: 'grid' },
}

export const confidential02: ConfidentialProject = {
  id: 'confidential-02',
  visibility: 'confidential',
  order: 4,
  status: 'published',
  review: { en: 'draft', he: 'draft' },
  title: { en: 'Confidential Operational Platform', he: 'פלטפורמה תפעולית חסויה' },
  summary: {
    en: 'Operational tooling developed for a security environment.',
    he: 'כלים תפעוליים שפותחו עבור סביבת אבטחה.',
  },
  disciplines: ['product-design', 'system-design', 'engineering'],
  cover: { kind: 'abstract', pattern: 'lines' },
}
