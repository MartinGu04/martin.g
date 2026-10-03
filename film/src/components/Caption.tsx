/**
 * The film's language system on screen. Hebrew leads: the human line, Noto Sans Hebrew,
 * heavy, revealed word by word in reading order (right to left). English supports: small,
 * tracked, in the site's label role, or alone as a campaign line. Never both at full size.
 */
import type { CSSProperties } from 'react'
import { brand } from '../config/palette'
import type { Format } from '../config/timeline'
import { clamp, ease } from '../lib/anim'
import { DISPLAY, HEBREW } from '../lib/fonts'
import { display, MaskLine } from './Type'

export const heLead = (fmt: Format): CSSProperties => ({
  fontFamily: HEBREW,
  fontWeight: 800,
  fontSize: fmt === 'portrait' ? 78 : 70,
  lineHeight: 1.12,
  color: brand.ink,
  direction: 'rtl',
  whiteSpace: 'nowrap',
  textShadow: '0 0 28px rgba(0,0,0,0.85), 0 0 8px rgba(0,0,0,0.6)',
})

export const enSupport = (fmt: Format): CSSProperties => ({
  fontFamily: DISPLAY,
  fontWeight: 600,
  fontStretch: '112%',
  letterSpacing: '0.32em',
  fontSize: fmt === 'portrait' ? 24 : 19,
  color: brand.muted,
  whiteSpace: 'nowrap',
  paddingInlineStart: '0.32em',
})

/**
 * Hebrew line, word by word in reading order (the row is right to left already, so the
 * first word is the rightmost); `out` lifts it away through the same mask.
 */
export function HeLine({
  text,
  f,
  at,
  out,
  fmt,
  color,
  style,
  breakAfter,
}: {
  text: string
  f: number
  at: number
  out?: number
  fmt: Format
  color?: string
  style?: CSSProperties
  /** Break into two lines after this many words (long lines on a phone). */
  breakAfter?: number
}) {
  if (breakAfter !== undefined) {
    const all = text.split(' ')
    const props = { f, out, fmt, color, style }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <HeLine {...props} text={all.slice(0, breakAfter).join(' ')} at={at} />
        <HeLine {...props} text={all.slice(breakAfter).join(' ')} at={at + breakAfter * 3} />
      </div>
    )
  }
  const words = text.split(' ')
  const o = out === undefined ? 0 : ease.mask(clamp((f - out) / 9))
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: '0.26em',
        ...heLead(fmt),
        color: color ?? brand.ink,
        ...style,
      }}
    >
      {words.map((w, i) => (
        <MaskLine key={i} p={ease.mask(clamp((f - at - i * 3) / 11))} out={o} pad={0.18}>
          <span style={{ display: 'inline-block' }}>{w}</span>
        </MaskLine>
      ))}
    </div>
  )
}

export function EnLine({
  text,
  f,
  at,
  out,
  fmt,
  style,
}: {
  text: string
  f: number
  at: number
  out?: number
  fmt: Format
  style?: CSSProperties
}) {
  const p = ease.mask(clamp((f - at) / 12))
  const o = out === undefined ? 0 : ease.mask(clamp((f - out) / 9))
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <MaskLine p={p} out={o}>
        <div style={{ ...enSupport(fmt), ...style }}>{text}</div>
      </MaskLine>
    </div>
  )
}

/** An English campaign line on its own, in the display role. */
export function Campaign({
  lines,
  f,
  at,
  out,
  size,
  style,
}: {
  lines: readonly string[]
  f: number
  at: number
  out?: number
  size: number
  style?: CSSProperties
}) {
  const o = out === undefined ? 0 : ease.mask(clamp((f - out) / 9))
  return (
    <div
      style={{
        ...display,
        fontSize: size,
        color: brand.ink,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        ...style,
      }}
    >
      {lines.map((l, i) => (
        <MaskLine key={i} p={ease.mask(clamp((f - at - i * 2) / 10))} out={o} pad={0.04}>
          {l}
        </MaskLine>
      ))}
    </div>
  )
}

/** A caption block centered on the frame's vertical axis at a given y (from the center). */
export function CaptionAt({
  y,
  children,
  opacity = 1,
}: {
  y: number
  children: React.ReactNode
  opacity?: number
}) {
  return (
    <div
      style={{
        position: 'absolute',
        insetInline: 0,
        insetBlockStart: '50%',
        transform: `translateY(${y}px)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 18,
        opacity,
      }}
    >
      {children}
    </div>
  )
}
