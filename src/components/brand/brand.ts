/**
 * Brand mark manifest. Components read only this. Rules are documented in
 * docs/DESIGN-SYSTEM.md.
 *
 * APPROVED ASSETS (Phase 6): the MARTIN.G wordmark and the MG symbol supplied by Martin.
 * Each file is the supplied artwork's own pixels as an alpha mask: coverage taken from
 * the artwork composited on white (only the wordmark's sub-5% compression noise around
 * the glyphs dropped), trimmed to the ink with a one-pixel margin, no metadata. Nothing is
 * redrawn or traced and the proportions are the artwork's. The marks are one color; the
 * mask is tinted with currentColor, the scene's text color, as the brand system has always
 * rendered its marks, so they read on dark and light worlds alike.
 *
 * Legibility: both marks are built from solid strokes. `thinRatio` is the thinnest typical
 * feature (a stroke, or the slit between two) as a share of the mark's height, measured on
 * the masks: wordmark 18 / 103 px, symbol 25 / 622 px (its slits). Minimum sizes keep that
 * feature at about 0.75 device pixels or more.
 */
export const brandMarks = {
  wordmark: {
    name: 'MARTIN.G',
    src: '/brand/martin-g-wordmark.png',
    width: 1090,
    height: 103,
    status: 'approved',
    thinRatio: 18 / 103,
    /** Clear space on every side, as a fraction of the rendered mark height. */
    clearSpace: 0.5,
    /** Minimum rendered height in CSS px by device pixel ratio (enforced in CSS). */
    minHeight: { 1: 14, 1.5: 12, 2: 12, 3: 12 },
  },
  monogram: {
    name: 'MG',
    src: '/brand/martin-g-symbol.png',
    width: 752,
    height: 622,
    status: 'approved',
    thinRatio: 25 / 622,
    clearSpace: 0.25,
    minHeight: { 1: 20, 1.5: 16, 2: 14, 3: 12 },
  },
} as const

export type BrandMarkKey = keyof typeof brandMarks

/** Device pixels covered by the thinnest typical feature at a given height and pixel ratio. */
export function thinFeatureDevicePx(mark: BrandMarkKey, heightPx: number, dpr: number): number {
  return heightPx * brandMarks[mark].thinRatio * dpr
}
