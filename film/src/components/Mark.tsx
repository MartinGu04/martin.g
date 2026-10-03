import type { CSSProperties } from 'react'
import { Img } from 'remotion'
import { assets } from '../config/assets'

/**
 * The supplied MARTIN.G symbol and wordmark, exactly as supplied: never redrawn, recolored,
 * outlined or distorted. Reveals happen through masks around the mark, never inside it.
 * Minimum sizes from docs/DESIGN-SYSTEM.md are far below anything the film renders.
 */
export function BrandSymbol({ width, style }: { width: number; style?: CSSProperties }) {
  const s = assets.symbol
  return (
    <Img src={s.src} style={{ display: 'block', width, height: (width * s.h) / s.w, ...style }} />
  )
}

export function Wordmark({ width, style }: { width: number; style?: CSSProperties }) {
  const s = assets.wordmark
  return (
    <Img src={s.src} style={{ display: 'block', width, height: (width * s.h) / s.w, ...style }} />
  )
}

export const symbolAspect = assets.symbol.w / assets.symbol.h
export const wordmarkAspect = assets.wordmark.w / assets.wordmark.h
