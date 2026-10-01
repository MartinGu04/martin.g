/**
 * A quiet project slate, numbered as on the site (01 ON, 02 המחלבה, 03 / 04 Defense
 * Systems): small, in the corner, in through a mask and out the same way. It names the
 * proof; it never advertises it. Portrait keeps it clear of the platform interface.
 */
import type { Format } from '../config/timeline'
import { ease, tw } from '../lib/anim'
import { HEBREW } from '../lib/fonts'
import { label, MaskLine } from './Type'

export function Slate({
  fmt,
  f,
  at,
  until,
  index,
  name,
  tone,
}: {
  fmt: Format
  f: number
  at: number
  until: number
  index: string
  name: string
  tone: string
}) {
  const p = tw(f, at, at + 10, ease.mask)
  const o = tw(f, until - 8, until, ease.mask)
  if (p <= 0 || o >= 1) return null
  const portrait = fmt === 'portrait'
  return (
    <div
      style={{
        position: 'absolute',
        insetInlineStart: portrait ? 72 : 96,
        insetBlockStart: portrait ? 300 : 84,
        display: 'flex',
        alignItems: 'baseline',
        gap: 18,
        color: tone,
        ...label,
        fontSize: portrait ? 26 : 20,
      }}
    >
      <MaskLine p={p} out={o}>
        <span style={{ opacity: 0.6 }}>{index}</span>
      </MaskLine>
      <MaskLine p={tw(f, at + 3, at + 13, ease.mask)} out={o}>
        <span
          style={{
            fontFamily: /[֐-׿]/.test(name) ? HEBREW : undefined,
            letterSpacing: /[֐-׿]/.test(name) ? 0 : undefined,
            fontWeight: 700,
          }}
        >
          {name}
        </span>
      </MaskLine>
    </div>
  )
}
