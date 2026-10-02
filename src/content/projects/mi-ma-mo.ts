import type { StaticImageData } from 'next/image'
import type { Localized } from '@/i18n/config'
import type { CropRegion, ImageCrop, ImageMedia, PublicProject } from '../schema'
import { mediaCopy } from '@/i18n/dictionaries/showcase'
import { caseMiMaMoMedia } from '@/i18n/dictionaries/case-mi-ma-mo'
import dashboard from '@/assets/work/mi-ma-mo/dashboard.png'
import dashboardFocus from '@/assets/work/mi-ma-mo/dashboard-focus.png'
import teamWeek from '@/assets/work/mi-ma-mo/team-week.png'
import teamWeekNarrow from '@/assets/work/mi-ma-mo/team-week-narrow.png'
import manager from '@/assets/work/mi-ma-mo/admin.png'
import managerView from '@/assets/work/mi-ma-mo/manager-view.png'
import teamWeekView from '@/assets/work/mi-ma-mo/team-week-view.png'
import mobile from '@/assets/work/mi-ma-mo/mobile.png'
import weekAhead from '@/assets/work/mi-ma-mo/week-ahead.png'

const alt = mediaCopy.miMaMo
const caseAlt = caseMiMaMoMedia

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
  /** On phones: the few Team Week columns that stay legible at that width. */
  teamWeekNarrow: { kind: 'image', src: teamWeekNarrow, alt: alt.teamWeek },
  teamWeekFull: { kind: 'image', src: teamWeek, alt: alt.teamWeek },
  /** The homepage cycle's views, cropped to the home screen's ratio so they share a frame. */
  teamWeekView: { kind: 'image', src: teamWeekView, alt: alt.teamWeek },
  managerView: { kind: 'image', src: managerView, alt: alt.manager },
  manager: { kind: 'image', src: manager, alt: alt.manager },
  /** The one device frame: the home screen on a phone. */
  mobile: { kind: 'image', src: mobile, alt: alt.mobile, fit: 'contain' },
  /** Home's week ahead, captured whole (supplied for the case study's operational picture). */
  weekAhead: { kind: 'image', src: weekAhead, alt: caseMiMaMoMedia.weekAhead },
} as const satisfies Record<string, ImageMedia>

type Box = readonly [x: number, y: number, width: number, height: number]
const box = ([x, y, width, height]: Box): CropRegion => ({ x, y, width, height })
const crop = (src: StaticImageData, region: Box, alt: Localized, mobile?: Box): ImageCrop => ({
  kind: 'crop',
  src,
  region: box(region),
  ...(mobile ? { mobile: box(mobile) } : {}),
  alt,
})

/**
 * The case study's views of the same approved screens (Phase 5B): regions of the existing
 * files in source pixels, never new assets, and never a region that brings back anything
 * removed (the pixels are already sanitized; a crop can only show less). Large views keep
 * a phone region of their own: the part that still reads at a phone's width. Team Week is
 * framed without the capture's horizontal scroll bar along its bottom edge.
 */
export const miMaMoCrops = {
  // The opening: Home beside the product's own navigation. Phones: the greeting, the
  // shortcuts and the next shift.
  opening: crop(dashboard, [440, 0, 1461, 700], caseAlt.opening, [1040, 110, 480, 560]),
  // 02 The operational picture.
  nextShift: crop(dashboard, [457, 382, 1058, 286], caseAlt.nextShift, [1015, 382, 500, 286]),
  shortcuts: crop(dashboard, [1050, 222, 465, 106], caseAlt.shortcuts),
  // The week ahead, whole: every day and its entries. Phones: the start of the week with
  // its title, and (a second frame, phones only) today and the day after it.
  weekAhead: crop(weekAhead, [0, 0, 1543, 263], caseAlt.weekAhead, [1088, 0, 455, 232]),
  weekAheadToday: crop(weekAhead, [50, 44, 425, 182], caseAlt.weekAheadToday),
  // 03 Built around the week.
  teamWeek: crop(teamWeek, [0, 0, 1442, 530], alt.teamWeek, [972, 0, 470, 530]),
  dayRow: crop(teamWeek, [480, 76, 962, 62], caseAlt.dayRow, [1100, 76, 342, 62]),
  // 04 Management at a glance: the three shift cards, one by one, and emergency mode.
  previous: crop(manager, [980, 465, 476, 325], caseAlt.previous),
  current: crop(manager, [497, 465, 472, 325], caseAlt.current),
  next: crop(manager, [12, 465, 475, 325], caseAlt.next),
  emergency: crop(manager, [12, 112, 1444, 90], caseAlt.emergency, [1060, 112, 396, 90]),
  // 05 One system, different contexts: the phone whole, frame included.
  phone: crop(mobile, [0, 0, 429, 867], alt.mobile),
  // 06 Key decisions: the evidence for each.
  homeOrder: crop(dashboard, [1040, 222, 480, 300], caseAlt.homeOrder),
  weekView: crop(teamWeek, [700, 0, 742, 410], caseAlt.weekView, [972, 0, 470, 410]),
  roleHeaders: crop(teamWeek, [430, 0, 1012, 140], caseAlt.roleHeaders, [930, 0, 512, 140]),
  snapshot: crop(manager, [12, 462, 1444, 175], caseAlt.snapshot, [497, 462, 472, 175]),
  phoneOrder: crop(mobile, [30, 150, 370, 500], caseAlt.phoneOrder),
  // 07 System details.
  coverageFull: crop(manager, [505, 480, 455, 95], caseAlt.coverageFull),
  coverageNone: crop(manager, [20, 480, 460, 95], caseAlt.coverageNone),
  todayHome: crop(dashboard, [480, 966, 210, 64], caseAlt.todayHome),
  todayWeek: crop(teamWeek, [1300, 326, 142, 80], caseAlt.todayWeek),
  typeLevels: crop(dashboard, [1240, 405, 255, 100], caseAlt.typeLevels),
  timeLeft: crop(manager, [515, 590, 435, 45], caseAlt.timeLeft),
  dayNight: crop(teamWeek, [618, 266, 264, 34], caseAlt.dayNight),
  phoneStack: crop(mobile, [36, 255, 360, 220], caseAlt.phoneStack),
  // 08 Result: the four views as stations, each recognizable at a glance (not for reading).
  stationHome: crop(dashboard, [440, 100, 1100, 688], alt.dashboard),
  stationWeek: crop(teamWeek, [602, 0, 840, 525], alt.teamWeek),
  stationManager: crop(manager, [200, 0, 1270, 794], alt.manager),
  stationPhone: crop(mobile, [0, 0, 429, 867], alt.mobile),
} as const satisfies Record<string, ImageCrop>

/**
 * Annotations drawn over three of those views: boxes around real parts of the interface,
 * in the same source pixels, so they stay on their element at every size. Each box is
 * numbered and named in the copy (case-mi-ma-mo.ts); the boxes themselves are decorative.
 */
export const miMaMoMarks = {
  picture: {
    nextShift: box([1250, 400, 250, 108]),
    crew: box([484, 582, 1002, 58]),
    coverage: box([478, 549, 92, 24]),
  },
  week: {
    roles: box([0, 2, 1386, 36]),
    entries: box([0, 76, 1386, 60]),
    today: box([1390, 333, 50, 66]),
  },
  phone: {
    greeting: box([40, 160, 352, 85]),
    shortcuts: box([38, 258, 354, 212]),
    nextShift: box([38, 530, 354, 115]),
    crew: box([38, 675, 354, 100]),
    sections: box([36, 793, 357, 52]),
  },
} as const satisfies Record<string, Record<string, CropRegion>>

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
  // public destination. The MARTIN.G case study is its presentation (Phase 5B), composed
  // from this material and its copy (src/components/case-study/mi-ma-mo,
  // src/i18n/dictionaries/case-mi-ma-mo.ts), so it carries no generic story blocks.
  story: [],
  seo: {
    title: { en: 'המחלבה', he: 'המחלבה' },
    description: {
      en: 'המחלבה: an operational workforce product for scheduling and management workflows.',
      he: 'המחלבה: מוצר תפעולי לניהול כוח אדם, שיבוצים ותהליכי ניהול.',
    },
  },
}
