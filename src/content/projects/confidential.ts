import type { ConfidentialProject } from '../schema'
import interfaceImage from '@/assets/confidential/confidential-01-interface.webp'

/*
 * Sanitized public identities only. Real names, clients, locations, dates, team sizes,
 * feature names and screenshots must never appear in this repository, including history.
 * These entries have no route and no link; they render only in the confidential section.
 *
 * One project, one card. The single exception to abstract covers is confidential-01's
 * final portfolio image, supplied and approved by Martin, anonymized in its pixels (no
 * readable text, names, numbers, dates, identifiers, product name or logo). Original
 * screenshots and intermediate sanitized versions never enter the repository.
 */

/*
 * Copy (Phase 8C): Martin's own wording in both languages for both projects, approved,
 * neutral by design (no classified, confidential, compartmentalized, secret, military,
 * operational or security terms). The alt text is generic: it never names the system or
 * what it is for.
 */
export const confidential01: ConfidentialProject = {
  id: 'confidential-01',
  visibility: 'confidential',
  order: 3,
  status: 'published',
  review: { en: 'approved', he: 'approved' },
  title: { en: 'Process Management System', he: 'מערכת לניהול תהליכים' },
  summary: {
    en: 'A purpose-built system for managing information, workflows, and outputs in an internal work environment.',
    he: 'כלי ייעודי לניהול מידע, תהליכי עבודה והפקת תוצרים בסביבת עבודה פנימית.',
  },
  disciplines: ['system-design', 'engineering'],
  cover: {
    kind: 'approved-interface',
    src: interfaceImage,
    alt: {
      en: 'Internal system interface with obscured details',
      he: 'ממשק מערכת פנימית עם פרטים מטושטשים',
    },
    // The working table and the side panel: the structure that reads as a real system.
    focal: { x: 0.5, y: 0.62 },
  },
}

export const confidential02: ConfidentialProject = {
  id: 'confidential-02',
  visibility: 'confidential',
  order: 4,
  status: 'published',
  review: { en: 'approved', he: 'approved' },
  title: { en: 'Infrastructure Management System', he: 'מערכת לניהול תשתיות' },
  summary: {
    en: 'An internal tool for consolidating technical information, coordinating workflows, and monitoring system components.',
    he: 'כלי פנימי לריכוז מידע טכני, תיאום תהליכים ובקרה על רכיבי מערכת.',
  },
  disciplines: ['product-design', 'system-design', 'engineering'],
  cover: { kind: 'abstract', pattern: 'lines' },
}
