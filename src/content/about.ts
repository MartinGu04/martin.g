import type { ImageMedia } from './schema'
import { mediaCopy } from '@/i18n/dictionaries/showcase'
import portraitDesktop from '@/assets/about/portrait-desktop.jpg'
import portraitMobile from '@/assets/about/portrait-mobile.jpg'

/**
 * Martin's portrait: the approved photograph (supplied in the brand polish pass), cropped
 * only: no retouching, grading or other edits, metadata removed. A 4:5 print from tablet up
 * (1099 × 1374, the photograph's full height); on phones a square, closer crop (1100 × 1100).
 */
export const aboutPortrait = {
  kind: 'image',
  src: portraitDesktop,
  alt: mediaCopy.about.portrait,
  art: { mobile: portraitMobile },
} as const satisfies ImageMedia
