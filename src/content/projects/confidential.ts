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
 * Copy (Phase 8C): the Hebrew title and summary are Martin's own wording, neutral by
 * design (no classified, confidential, compartmentalized, secret, military, operational
 * or security terms). The English and both alt texts are drafts awaiting his approval, so
 * the release gate refuses a production build until then.
 */
export const confidential01: ConfidentialProject = {
  id: 'confidential-01',
  visibility: 'confidential',
  order: 3,
  status: 'published',
  review: { en: 'draft', he: 'draft' },
  title: { en: 'Process Management System', he: 'מערכת לניהול תהליכים' },
  summary: {
    en: 'A dedicated tool for managing information, workflows and the production of deliverables in an internal work environment.',
    he: 'כלי ייעודי לניהול מידע, תהליכי עבודה והפקת תוצרים בסביבת עבודה פנימית.',
  },
  disciplines: ['system-design', 'engineering'],
  cover: {
    kind: 'approved-interface',
    src: interfaceImage,
    alt: {
      en: 'The system’s interface, with all text and details blurred.',
      he: 'ממשק המערכת, כשכל הטקסט והפרטים בו מטושטשים.',
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
  title: { en: 'Confidential Operational Platform', he: 'פלטפורמה תפעולית חסויה' },
  summary: {
    en: 'Operational tooling developed for a security environment.',
    he: 'כלים תפעוליים שפותחו עבור סביבת אבטחה.',
  },
  disciplines: ['product-design', 'system-design', 'engineering'],
  cover: { kind: 'abstract', pattern: 'lines' },
}
