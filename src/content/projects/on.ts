import type { StaticImageData } from 'next/image'
import type { Localized } from '@/i18n/config'
import type { CropRegion, ImageCrop, ImageMedia, PublicProject, VideoMedia } from '../schema'
import { mediaCopy } from '@/i18n/dictionaries/showcase'
import { caseOnMedia } from '@/i18n/dictionaries/case-on'
import patisserie from '@/assets/work/on/patisserie.jpg'
import venue from '@/assets/work/on/venue.jpg'
import siteHome from '@/assets/work/on/site-home.jpg'
import siteStory from '@/assets/work/on/site-story.jpg'
import siteMobile from '@/assets/work/on/site-mobile.jpg'
import filmPoster from '@/assets/work/on/film-poster.jpg'
import mark from '@/assets/work/on/symbol.png'

const alt = mediaCopy.on

/**
 * ON's real material: retreat photography and the live website. Only the approved,
 * published brand assets; the brand film is the client's watermarked preview, never a
 * master.
 */
export const onMedia = {
  /** The real ON monogram (gold, transparent), used as the project's title mark. */
  mark: { kind: 'image', src: mark, alt: { en: 'ON', he: 'ON' }, fit: 'contain' },
  /** The atmosphere around the work: the retreat's own garden. */
  stage: { kind: 'image', src: venue, alt: alt.venue },
  /** Supporting: a local stop on the retreat's route. */
  patisserie: { kind: 'image', src: patisserie, alt: alt.patisserie },
  venue: { kind: 'image', src: venue, alt: alt.venue },
  /** The website's opening screen; on phones, the same screen on a phone. */
  site: {
    kind: 'image',
    src: siteHome,
    alt: alt.siteHome,
    art: { mobile: siteMobile },
  },
  /** The print's second view (on phones the phone screen again, so phones see one view). */
  siteStoryPrint: {
    kind: 'image',
    src: siteStory,
    alt: alt.siteStory,
    art: { mobile: siteMobile },
  },
  siteHome: { kind: 'image', src: siteHome, alt: alt.siteHome },
  siteStory: { kind: 'image', src: siteStory, alt: alt.siteStory },
  siteMobile: { kind: 'image', src: siteMobile, alt: alt.siteMobile },
  /** The monogram whole, as a plate in the case study's direction chapter. */
  monogram: { kind: 'image', src: mark, alt: caseOnMedia.monogram, fit: 'contain' },
  film: {
    kind: 'video',
    source: {
      provider: 'static',
      files: [{ src: '/media/on/film-preview.mp4', type: 'video/mp4' }],
    },
    poster: filmPoster,
    alt: alt.film,
    autoplay: 'never',
  },
} as const satisfies Record<string, ImageMedia | VideoMedia>

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
 * Details of the same approved material, examined up close in the case study: regions of
 * the website's real screens and of the monogram, in source pixels. No new assets: each
 * detail loads the image it comes from.
 */
export const onCrops = {
  /*
   * The two screens whole, without the capture's edges (a few white pixels along the
   * desktop screenshot's right and bottom, a dark scroll strip along the phone's right).
   * On phones the desktop opening is framed on the mark, the question and the action.
   */
  siteHome: crop(siteHome, [0, 0, 1602, 990], alt.siteHome, [380, 180, 910, 720]),
  siteMobile: crop(siteMobile, [0, 0, 382, 704], alt.siteMobile),
  headline: crop(siteHome, [400, 470, 870, 200], caseOnMedia.headline),
  lockup: crop(siteHome, [1025, 205, 245, 185], caseOnMedia.lockup),
  eyebrow: crop(siteHome, [1035, 420, 235, 42], caseOnMedia.eyebrow),
  cta: crop(siteHome, [970, 780, 300, 105], caseOnMedia.cta),
  datePlace: crop(siteHome, [900, 945, 370, 40], caseOnMedia.datePlace),
  nav: crop(siteHome, [30, 5, 910, 52], caseOnMedia.nav),
  pillDark: crop(siteHome, [36, 4, 182, 54], caseOnMedia.pillDark),
  pillLight: crop(siteStory, [8, 4, 182, 56], caseOnMedia.pillLight),
  // Phones: the two numbers at the inline start of the row, at a size that still reads.
  numerals: crop(siteStory, [690, 76, 170, 220], caseOnMedia.numerals),
  numbers: crop(siteStory, [0, 72, 1245, 230], caseOnMedia.numbers, [622, 72, 623, 230]),
  rhythm: crop(siteStory, [830, 560, 415, 320], caseOnMedia.rhythm),
  arch: crop(siteStory, [10, 396, 490, 600], caseOnMedia.arch),
  // The phone screen ends in a dark scroll edge at its inline end: never shown.
  mobileTop: crop(siteMobile, [0, 0, 382, 330], caseOnMedia.mobileTop),
  mobileAction: crop(siteMobile, [0, 620, 382, 84], caseOnMedia.mobileAction),
  ribbon: crop(mark, [300, 150, 420, 319], caseOnMedia.ribbon),
} as const satisfies Record<string, ImageCrop>

/**
 * Primary showcase. Its case study (Phase 5A) is composed from this material and its copy
 * (src/components/case-study/on, src/i18n/dictionaries/case-on.ts), so it carries no
 * generic story blocks. Years stay omitted until confirmed.
 */
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
  cover: onMedia.siteHome,
  links: { live: 'https://www.onbyortal.com/' },
  story: [],
  seo: {
    title: { en: 'ON', he: 'ON' },
    description: {
      en: 'ON: a premium dating retreat brand and digital experience.',
      he: 'ON: מותג ריטריט היכרויות פרימיום וחוויה דיגיטלית.',
    },
  },
}
