import type { ImageMedia } from './schema'
import { mediaCopy } from '@/i18n/dictionaries/showcase'
import portraitDesktop from '@/assets/about/portrait-desktop.jpg'
import portraitMobile from '@/assets/about/portrait-mobile.jpg'

/**
 * Martin's portrait: the real photograph, cropped and graded only (warmth, gentle contrast,
 * a soft falloff toward the edges, restrained grain). No retouching. A 4:5 print from tablet
 * up; on phones a square, closer crop.
 */
export const aboutPortrait = {
  kind: 'image',
  src: portraitDesktop,
  alt: mediaCopy.about.portrait,
  art: { mobile: portraitMobile },
} as const satisfies ImageMedia
