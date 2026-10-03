/**
 * Loads the site's own self-hosted faces before any frame is captured: Archivo (Latin,
 * variable width and weight) and Noto Sans Hebrew. Nothing renders in a fallback face.
 */
import { continueRender, delayRender, staticFile } from 'remotion'

export const DISPLAY = "'Archivo', sans-serif"
export const HEBREW = "'Noto Sans Hebrew', 'Archivo', sans-serif"
export const UI =
  "'Noto Sans Hebrew', 'Archivo', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif"

let started = false
export function loadFonts() {
  if (started || typeof document === 'undefined') return
  started = true
  const handle = delayRender('fonts')
  const faces = [
    new FontFace(
      'Archivo',
      `url(${staticFile('fonts/archivo-latin-wdth-wght.woff2')}) format('woff2')`,
      {
        weight: '300 900',
        stretch: '100% 125%',
      },
    ),
    new FontFace(
      'Noto Sans Hebrew',
      `url(${staticFile('fonts/noto-sans-hebrew-hebrew-wght.woff2')}) format('woff2')`,
      {
        weight: '100 900',
      },
    ),
  ]
  Promise.all(faces.map((f) => f.load()))
    .then((loaded) => {
      loaded.forEach((f) => document.fonts.add(f))
      return document.fonts.ready
    })
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error(err)
      continueRender(handle)
    })
}
