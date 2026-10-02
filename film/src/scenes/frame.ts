/**
 * The one frame that carries the first half of the film: it is drawn by the idea's line,
 * becomes a website, a product, a brand, a system, and finally opens into the proof. Every
 * scene that touches it reads its geometry here, so the handovers match to the pixel.
 */
import type { Format } from '../config/timeline'
import { MG } from '../brand/geometry'

/** Real blocks of each site page, in its own pixels: what the wireframe and the craft scene draw. */
export const BLOCKS = {
  landscape: [
    [40, 8, 1220, 46],
    [1035, 212, 228, 175],
    [1050, 428, 210, 26],
    [410, 478, 850, 92],
    [410, 570, 850, 95],
    [800, 700, 460, 60],
    [982, 792, 277, 56],
    [40, 940, 1220, 40],
  ],
  portrait: [
    [15, 10, 360, 45],
    [175, 100, 195, 150],
    [180, 285, 180, 22],
    [140, 330, 225, 165],
    [40, 525, 320, 85],
    [20, 640, 340, 55],
  ],
} as const satisfies Record<Format, readonly (readonly [number, number, number, number])[]>

export function frameGeom(fmt: Format) {
  if (fmt === 'portrait') {
    return {
      /** the website frame (the mobile page's proportions) */
      web: { x: 0, y: -170, w: 620, h: (620 * 704) / 390 },
      /** the M outline the opening traces, in screen px */
      m: { k: 0.83, x: -(MG.w * 0.83) / 2, y: -170 - (620 * 704) / 390 / 2 - 8 },
      caption: { y: 560 },
    }
  }
  return {
    web: { x: 0, y: -90, w: 1040, h: 645 },
    m: { k: 1.19, x: -(MG.w * 1.19) / 2, y: -90 - 645 / 2 - 12 },
    caption: { y: 340 },
  }
}
