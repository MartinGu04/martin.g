import type { CSSProperties, ReactNode } from 'react'
import { DISPLAY } from '../lib/fonts'
import { clamp } from '../lib/anim'

/**
 * Display type in the site's display role: Archivo, heavy and expanded, tight tracking
 * (t-display-xl / t-hero). Text is never faded in: it arrives through masks.
 */
export const display: CSSProperties = {
  fontFamily: DISPLAY,
  fontWeight: 800,
  fontStretch: '125%',
  letterSpacing: '-0.045em',
  lineHeight: 0.86,
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
}

export const label: CSSProperties = {
  fontFamily: DISPLAY,
  fontWeight: 600,
  fontStretch: '112%',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
}

/**
 * One line revealed by a mask: `p` 0 → 1 moves it in from below its own line box, `out`
 * 0 → 1 moves it out above. The clip is the line box, so nothing shows outside it.
 */
export function MaskLine({
  p,
  out = 0,
  children,
  style,
  pad = 0.12,
}: {
  p: number
  out?: number
  children: ReactNode
  style?: CSSProperties
  pad?: number
}) {
  const y = (1 - clamp(p)) * 112 - clamp(out) * 112
  return (
    <div
      style={{ overflow: 'hidden', paddingBlock: `${pad}em`, marginBlock: `${-pad}em`, ...style }}
    >
      <div style={{ transform: `translateY(${y}%)` }}>{children}</div>
    </div>
  )
}

/** Per-letter masks: each letter rises on its own delay (frames), for words that build. */
export function MaskLetters({
  text,
  f,
  at,
  stagger = 1.5,
  dur = 10,
  ease,
  out,
  outAt,
  style,
}: {
  text: string
  f: number
  at: number
  stagger?: number
  dur?: number
  ease: (t: number) => number
  out?: boolean
  outAt?: number
  style?: CSSProperties
}) {
  return (
    <div style={{ display: 'flex', ...style }}>
      {[...text].map((ch, i) => {
        const a = at + i * stagger
        const p = ease(clamp((f - a) / dur))
        const o = out && outAt !== undefined ? ease(clamp((f - outAt - i * stagger) / dur)) : 0
        return (
          <MaskLine key={i} p={p} out={o}>
            <span style={{ display: 'inline-block', whiteSpace: 'pre' }}>{ch}</span>
          </MaskLine>
        )
      })}
    </div>
  )
}
