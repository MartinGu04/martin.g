/**
 * 08 MAKE IT REAL. Silence. The real MG symbol replaces the mosaic exactly where it formed,
 * on the brand chord heard at the beginning. It settles above the supplied MARTIN.G wordmark, which is uncovered by a
 * single mask, and the locked campaign line arrives beneath. A hold long enough to read;
 * one last deep note; black. No call to action, no URL, no handles.
 */
import { AbsoluteFill } from 'remotion'
import { copy } from '../config/copy'
import { brand } from '../config/palette'
import { s } from '../config/timeline'
import { ease, jolt, mix, tw } from '../lib/anim'
import { BrandSymbol, Wordmark, symbolAspect, wordmarkAspect } from '../components/Mark'
import { label, MaskLine } from '../components/Type'
import { KeyLight } from '../components/Atmosphere'
import { MOSAIC } from './World'
import type { SceneProps } from './types'

export function Signature({ v, f }: SceneProps) {
  const c = v.cues
  const portrait = v.fmt === 'portrait'
  const W = portrait ? 1080 : 1920
  const H = portrait ? 1920 : 1080
  const symbol = s(c.symbol)
  const wordmark = s(c.wordmark)
  const line = s(c.line)
  const black = s(c.black)
  if (f < symbol) return null

  const m = MOSAIC[v.fmt]
  // Final lockup, designed for each frame.
  const lock = portrait
    ? { symW: 460, symY: -300, wmW: 820, wmY: 20, lineY: 130, lineSize: 34 }
    : { symW: 360, symY: -170, wmW: 760, wmY: 60, lineY: 160, lineSize: 28 }
  const settle = tw(f, symbol + 10, wordmark + 6, ease.scene)
  const symW = mix(m.w, lock.symW, settle)
  const symY = mix(m.y, lock.symY, settle)
  const symH = symW / symbolAspect
  const wmH = lock.wmW / wordmarkAspect
  const reveal = tw(f, wordmark, wordmark + 14, ease.mask)
  const lineP = tw(f, line, line + 10, ease.mask)
  const breathe = 1 + 0.018 * tw(f, line, black, ease.linear)
  const kick = 1 + jolt(f, symbol, 0.012, 8)

  return (
    <AbsoluteFill style={{ background: brand.black }}>
      <KeyLight
        x={50}
        y={45}
        size={portrait ? 90 : 55}
        strength={0.07 * (1 - tw(f, symbol, symbol + 20)) + 0.035}
      />
      <AbsoluteFill style={{ transform: `scale(${breathe * kick})` }}>
        <div
          style={{
            position: 'absolute',
            insetInlineStart: W / 2 - symW / 2,
            insetBlockStart: H / 2 + symY - symH / 2,
          }}
        >
          <BrandSymbol width={symW} />
        </div>
        <div
          style={{
            position: 'absolute',
            insetInlineStart: W / 2 - lock.wmW / 2,
            insetBlockStart: H / 2 + lock.wmY - wmH / 2,
            clipPath: `inset(-10% ${(1 - reveal) * 100}% -10% 0)`,
          }}
        >
          <Wordmark width={lock.wmW} />
        </div>
        <div
          style={{
            position: 'absolute',
            insetInline: 0,
            insetBlockStart: H / 2 + lock.lineY,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <MaskLine p={lineP}>
            <div
              style={{
                ...label,
                fontSize: lock.lineSize,
                letterSpacing: '0.42em',
                color: brand.ink,
                paddingInlineStart: '0.42em',
              }}
            >
              {copy.endLine}
            </div>
          </MaskLine>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
