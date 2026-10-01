/**
 * Where everything sits once the product has resolved (the "tile"): a 1920 × 1080 or
 * 1080 × 1920 composition centered on the origin. The product scene animates towards this
 * state; the wall scene shows it frozen as one tile of a much larger system.
 */
import type { Format } from '../config/timeline'
import { cellCenter, scheduleGeom } from '../components/MiMaMo'

export function productLayout(fmt: Format) {
  if (fmt === 'portrait') {
    const sched = { x: 0, y: 330, w: 940, cols: 4 }
    return {
      fmt,
      sched,
      card: { x: 0, y: -330, w: 940 },
      greeting: { x: 120, y: -640, w: 640 },
      small: [] as { x: number; y: number; w: number; title: string; line: string; icon: string }[],
      phone: null as null | { x: number; y: number; w: number },
      notice: { x: 0, y: -820, w: 600 },
      clock: { x: -330, y: -650, size: 34 },
      move: { from: [2, 2] as const, to: [4, 1] as const },
    }
  }
  return {
    fmt,
    sched: { x: -150, y: 70, w: 1040, cols: 8 },
    card: { x: 650, y: 40, w: 520 },
    greeting: { x: 690, y: -330, w: 420 },
    small: [
      { x: 776, y: -175, w: 250, title: 'דוח 1 למחר', line: 'מוכן עבור 02.10', icon: '🧾' },
      { x: 516, y: -175, w: 250, title: 'צוות השבוע', line: 'מי עובד השבוע', icon: '👥' },
    ],
    phone: { x: -800, y: 60, w: 260 } as null | { x: number; y: number; w: number },
    notice: { x: -800, y: -150, w: 250 },
    clock: { x: -800, y: -330, size: 26 },
    move: { from: [1, 5] as const, to: [4, 4] as const },
  }
}

export type ProductLayout = ReturnType<typeof productLayout>

/** A cell's center in tile coordinates. */
export function cellInTile(l: ProductLayout, row: number, col: number) {
  const g = scheduleGeom(l.sched.w, l.sched.cols)
  const h = g.headH + 7 * g.rowH
  const p = cellCenter(g, l.sched.w, row, col)
  return { x: l.sched.x - l.sched.w / 2 + p.x, y: l.sched.y - h / 2 + p.y, g, h }
}
