/**
 * The approved MG symbol's own geometry, measured on the supplied artwork (766 × 636 px,
 * film/brand/mg-symbol.png). The film borrows it as a visual language: the opening line
 * traces the M's outline, wipes and rails run at its diagonal, the finale assembles the
 * real mark. The mark itself is only ever shown as supplied.
 */
export const MG = { w: 766, h: 636 }

/** The M's outer outline, as one continuous line (stems, the two diagonals, chamfers). */
export const M_TRACE: readonly (readonly [number, number])[] = [
  [110, 572],
  [10, 500],
  [10, 12],
  [383, 258],
  [756, 12],
  [756, 500],
  [655, 568],
]

/** The mark's diagonal: about 34 degrees from horizontal. */
export const DIAGONAL_DEG = 34
export const DIAGONAL = Math.tan((DIAGONAL_DEG * Math.PI) / 180)

/** Length of a polyline and the point at a given distance along it. */
export function polyLength(pts: readonly (readonly [number, number])[]) {
  let L = 0
  for (let i = 1; i < pts.length; i++)
    L += Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1])
  return L
}

export function pointAt(pts: readonly (readonly [number, number])[], d: number): [number, number] {
  let rest = Math.max(0, d)
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]!
    const [x1, y1] = pts[i]!
    const l = Math.hypot(x1 - x0, y1 - y0)
    if (rest <= l) return [x0 + ((x1 - x0) * rest) / l, y0 + ((y1 - y0) * rest) / l]
    rest -= l
  }
  return [...pts[pts.length - 1]!] as [number, number]
}

/**
 * A clip-path polygon that reveals everything on the inline-start side of a slanted edge at
 * the mark's diagonal. `x` is where the edge crosses the vertical middle (px).
 */
export function diagonalReveal(x: number, w: number, h: number) {
  const dx = (h / 2) * DIAGONAL * 0.9
  return `polygon(-10% -10%, ${x + dx}px -10%, ${x - dx}px 110%, -10% 110%)`
}
