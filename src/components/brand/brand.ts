/**
 * Brand mark manifest. Components read only this, so production assets can replace the
 * provisional ones without API changes.
 *
 * PROVISIONAL: alpha masks derived from the reference PNGs (color removed, trimmed,
 * metadata stripped, proportions untouched). They render through CSS masks tinted with
 * currentColor. Replace with production SVGs (outlined, currentColor, tight viewBox,
 * one group per glyph) when they are ready.
 */
export const brandMarks = {
  wordmark: {
    name: 'MARTIN.G',
    src: '/brand/provisional/wordmark-mask.png',
    width: 1335,
    height: 228,
    status: 'provisional',
  },
  monogram: {
    name: 'MG',
    src: '/brand/provisional/monogram-mask.png',
    width: 968,
    height: 599,
    status: 'provisional',
  },
} as const

export type BrandMarkKey = keyof typeof brandMarks
