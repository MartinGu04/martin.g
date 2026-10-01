import type { ImageMedia, PublicProject } from '../schema'
import { mediaCopy } from '@/i18n/dictionaries/showcase'
import dashboard from '@/assets/work/mi-ma-mo/dashboard.png'
import dashboardFocus from '@/assets/work/mi-ma-mo/dashboard-focus.png'
import teamWeek from '@/assets/work/mi-ma-mo/team-week.png'
import teamWeekNarrow from '@/assets/work/mi-ma-mo/team-week-narrow.png'
import teamWeekStrip from '@/assets/work/mi-ma-mo/team-week-strip.png'
import manager from '@/assets/work/mi-ma-mo/admin.png'
import mobile from '@/assets/work/mi-ma-mo/mobile.png'

const alt = mediaCopy.miMaMo
const caption = mediaCopy.miMaMoCaptions

/**
 * Real product screens, sanitized before they entered the repository: personnel names are
 * replaced by neutral bars, identifying insignia and one internal module are removed from
 * the pixels themselves (nothing is hidden with CSS). Screens that are dense with personal
 * schedules (the month view, the fairness table) are not published at all.
 */
export const miMaMoMedia = {
  /** The hero visual: the home screen, cropped to the part that reads at real scale. */
  dashboard: { kind: 'image', src: dashboardFocus, alt: alt.dashboard },
  dashboardFull: { kind: 'image', src: dashboard, alt: alt.dashboard },
  /**
   * A cropped interface detail at a readable scale: four days across seven people on
   * desktop; on tablets and phones, the few columns that stay legible at their width.
   */
  teamWeek: {
    kind: 'image',
    src: teamWeekStrip,
    alt: alt.teamWeek,
    art: { mobile: teamWeekNarrow, tablet: teamWeekNarrow },
  },
  teamWeekFull: { kind: 'image', src: teamWeek, alt: alt.teamWeek },
  manager: { kind: 'image', src: manager, alt: alt.manager },
  /** The one device frame: the home screen on a phone. */
  mobile: { kind: 'image', src: mobile, alt: alt.mobile, fit: 'contain' },
} as const satisfies Record<string, ImageMedia>

/**
 * Operational workforce product. Its public name is המחלבה; the id and slug stay
 * `mi-ma-mo`, so routes and data need no migration.
 */
export const miMaMo: PublicProject = {
  id: 'mi-ma-mo',
  visibility: 'public',
  order: 2,
  status: 'published',
  review: { en: 'approved', he: 'approved' },
  title: { en: 'המחלבה', he: 'המחלבה' },
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
  cover: miMaMoMedia.dashboardFull,
  // No live link: the product is a signed-in tool with real operational data, not a
  // public destination. The MARTIN.G project page is its presentation.
  story: [
    {
      type: 'sequence',
      items: [
        { media: miMaMoMedia.teamWeekFull, caption: caption.teamWeek },
        { media: miMaMoMedia.manager, caption: caption.manager },
        { media: miMaMoMedia.mobile, caption: caption.mobile },
      ],
    },
  ],
  seo: {
    title: { en: 'המחלבה', he: 'המחלבה' },
    description: {
      en: 'המחלבה: an operational workforce product for scheduling and management workflows.',
      he: 'המחלבה: מוצר תפעולי לניהול כוח אדם, שיבוצים ותהליכי ניהול.',
    },
  },
}
