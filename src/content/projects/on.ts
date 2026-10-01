import type { ImageMedia, PublicProject, VideoMedia } from '../schema'
import { mediaCopy } from '@/i18n/dictionaries/showcase'
import patisserie from '@/assets/work/on/patisserie.jpg'
import venue from '@/assets/work/on/venue.jpg'
import venuePortrait from '@/assets/work/on/venue-portrait.jpg'
import siteHome from '@/assets/work/on/site-home.jpg'
import siteStory from '@/assets/work/on/site-story.jpg'
import siteMobile from '@/assets/work/on/site-mobile.jpg'
import filmPoster from '@/assets/work/on/film-poster.jpg'
import mark from '@/assets/work/on/symbol.png'

const alt = mediaCopy.on
const caption = mediaCopy.onCaptions

/**
 * ON's real material: retreat photography and the live website. Only the approved,
 * published brand assets; the brand film is the client's watermarked preview, never a
 * master.
 */
export const onMedia = {
  /** The real ON monogram (gold, transparent), used as the project's title mark. */
  mark: { kind: 'image', src: mark, alt: { en: 'ON', he: 'ON' }, fit: 'contain' },
  /** The dominant photograph: the retreat's own garden; on phones, a 4:5 crop of it. */
  stage: { kind: 'image', src: venue, alt: alt.venue, art: { mobile: venuePortrait } },
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

/** Primary showcase. The long-form case study and years arrive in Phase 5. */
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
  story: [
    { type: 'media', media: onMedia.film, layout: 'wide' },
    {
      type: 'sequence',
      items: [
        { media: onMedia.siteStory, caption: caption.siteStory },
        { media: onMedia.siteMobile, caption: caption.siteMobile },
        { media: onMedia.venue, caption: caption.venue },
        { media: onMedia.patisserie, caption: caption.patisserie },
      ],
    },
  ],
  seo: {
    title: { en: 'ON', he: 'ON' },
    description: {
      en: 'ON: a premium dating retreat brand and digital experience.',
      he: 'ON: מותג ריטריט היכרויות פרימיום וחוויה דיגיטלית.',
    },
  },
}
