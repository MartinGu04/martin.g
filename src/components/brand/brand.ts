/**
 * Brand mark manifest. Components read only this, so production assets can replace the
 * provisional ones without API changes. Rules are documented in docs/DESIGN-SYSTEM.md.
 *
 * PROVISIONAL ASSETS: alpha masks derived from the reference PNGs (color removed, trimmed,
 * metadata stripped, proportions untouched), tinted with currentColor through CSS masks.
 * They are not production artwork. Production SVGs (outlined, currentColor, tight viewBox,
 * one group per glyph) replace them without API changes.
 *
 * Legibility: the marks' hairlines are about 2% of their height (measured on the masks:
 * wordmark ~4.5px at 228px, monogram ~11px at 599px). That is a property of the design,
 * not only of the raster: a vector at the same size has the same sub-pixel hairlines.
 * Minimum sizes keep a typical hairline at about 0.6 device pixels or more. Below them the
 * thin strokes vanish (the wordmark's M reads as an N). A small-size optical cut of the
 * marks would be a brand decision, not something to fake in code.
 */
export const brandMarks = {
  wordmark: {
    name: 'MARTIN.G',
    src: '/brand/provisional/wordmark-mask.png',
    width: 1335,
    height: 228,
    status: 'provisional',
    hairlineRatio: 4.5 / 228,
    /** Clear space on every side, as a fraction of the rendered mark height. */
    clearSpace: 0.5,
    /** Minimum rendered height in CSS px by device pixel ratio (enforced in CSS). */
    minHeight: { 1: 32, 1.5: 21, 2: 18, 3: 14 },
  },
  monogram: {
    name: 'MG',
    src: '/brand/provisional/monogram-mask.png',
    width: 968,
    height: 599,
    status: 'provisional',
    hairlineRatio: 11 / 599,
    clearSpace: 0.25,
    minHeight: { 1: 30, 1.5: 22, 2: 16, 3: 12 },
  },
} as const

export type BrandMarkKey = keyof typeof brandMarks

/** Device pixels covered by a typical hairline at a given height and pixel ratio. */
export function hairlineDevicePx(mark: BrandMarkKey, heightPx: number, dpr: number): number {
  return heightPx * brandMarks[mark].hairlineRatio * dpr
}
