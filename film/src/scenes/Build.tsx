/**
 * 08 FROM IDEA TO LIVE PRODUCT. Faster. Four words from the site's own process, each
 * landing on its beat, each changing the page beside it:
 *   UNDERSTAND.  a rough grid and a field of dots
 *   DEFINE.      wireframe boxes, every block of the real page
 *   DESIGN.      the real pixels and type arrive, block by block
 *   BUILD.       code at the edges; a click; the page is live
 * Then the page takes the whole frame and the film accelerates into its peak.
 */
import { AbsoluteFill } from 'remotion'
import { assets } from '../config/assets'
import { copy } from '../config/copy'
import { brand, world } from '../config/palette'
import { s } from '../config/timeline'
import { clamp, drift, ease, tw } from '../lib/anim'
import { Crop } from '../components/media'
import { CODE } from '../components/Fragments'
import { Cursor } from '../components/MiMaMo'
import { display, MaskLine } from '../components/Type'
import { DISPLAY } from '../lib/fonts'
import type { SceneProps } from './types'

type Region = readonly [number, number, number, number]
const BLOCKS: Record<'landscape' | 'portrait', { r: Region; cta?: boolean }[]> = {
  landscape: [
    { r: [40, 8, 1220, 46] },
    { r: [1035, 212, 228, 175] },
    { r: [1050, 428, 210, 26] },
    { r: [410, 478, 850, 92] },
    { r: [410, 570, 850, 95] },
    { r: [800, 700, 460, 60] },
    { r: [982, 792, 277, 56], cta: true },
    { r: [40, 940, 1220, 40] },
  ],
  portrait: [
    { r: [15, 10, 360, 45] },
    { r: [175, 100, 195, 150] },
    { r: [180, 285, 180, 22] },
    { r: [140, 330, 225, 165] },
    { r: [40, 525, 320, 85] },
    { r: [20, 640, 340, 55], cta: true },
  ],
}

export function Build({ v, f }: SceneProps) {
  const c = v.cues
  const portrait = v.fmt === 'portrait'
  const W = portrait ? 1080 : 1920
  const H = portrait ? 1920 : 1080
  const p0 = s(c.process)
  const launch = s(c.launch)
  const step = (launch - p0) / 4
  const at = (i: number) => p0 + i * step
  const src = portrait ? assets.on.mobile : assets.on.home
  const blocks = BLOCKS[v.fmt]

  // Page frame: right of the words on 16:9, below them on 9:16.
  const pw = portrait ? 620 : 960
  const ph = (pw * src.h) / src.w
  const k = pw / src.w
  const px = portrait ? (W - pw) / 2 : W - pw - 110
  const py = portrait ? 700 : (H - ph) / 2 + 20

  const grid = tw(f, at(0) - 3, at(0) + 8, ease.out)
  const wire = (i: number) => tw(f, at(1) - 2 + i * 1, at(1) + 4 + i * 1, ease.snap)
  const fill = (i: number) => tw(f, at(2) - 2 + i * 1.2, at(2) + 5 + i * 1.2, ease.mask)
  const code = tw(f, at(3) - 2, at(3) + 6, ease.out)
  const click = at(3) + 6
  const pressed = tw(f, click - 2, click, ease.out) * (1 - tw(f, click + 2, click + 5))
  const cta = blocks.find((b) => b.cta)!
  const ctaPos = {
    x: px + (cta.r[0] + cta.r[2] * 0.4) * k,
    y: py + (cta.r[1] + cta.r[3] * 0.6) * k,
  }
  const cursorPos = {
    x: ctaPos.x + (1 - tw(f, at(3) - 2, click - 2, ease.inOut)) * 260,
    y: ctaPos.y + (1 - tw(f, at(3) - 2, click - 2, ease.inOut)) * 180,
  }
  const cursorO = tw(f, at(3) - 2, at(3) + 2) * (1 - tw(f, click + 6, click + 9))

  // Launch: the page takes the frame.
  const go = tw(f, launch - 6, launch + 2, ease.in)
  const fillScale = Math.max(W / pw, H / ph)
  const scale = 1 + (fillScale - 1) * go
  const cx = px + pw / 2
  const cy = py + ph / 2
  const tx = (W / 2 - cx) * go
  const ty = (H / 2 - cy) * go
  const enter = tw(f, p0 - 6, p0 + 4, ease.out)

  // Words: one at a time, rolling through a mask on each beat.
  const words = copy.process
  const wordSize = portrait ? 150 : 172
  return (
    <AbsoluteFill style={{ background: world.graphite.bg, opacity: enter }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 70% at ${portrait ? '50% 60%' : '70% 50%'}, rgba(255,244,230,0.07), rgba(255,244,230,0) 70%)`,
        }}
      />
      {/* the words */}
      <div
        style={{
          position: 'absolute',
          insetInlineStart: portrait ? 72 : 110,
          insetBlockStart: portrait ? 330 : H / 2 - wordSize * 0.55,
          opacity: 1 - go,
          transform: `translateY(${drift(f, 51, 3)}px)`,
        }}
      >
        <div style={{ position: 'relative', height: wordSize * 1.0, width: portrait ? 940 : 680 }}>
          {words.map((w, i) => {
            const pIn = tw(f, at(i) - 4, at(i) + 3, ease.mask)
            const pOut = i < words.length - 1 ? tw(f, at(i + 1) - 4, at(i + 1) + 2, ease.mask) : 0
            if (pIn <= 0 || pOut >= 1) return null
            const fit = portrait
              ? Math.min(1, 940 / (w.length * wordSize * 0.78))
              : Math.min(1, 680 / (w.length * wordSize * 0.8))
            return (
              <div key={w} style={{ position: 'absolute', inset: 0 }}>
                <MaskLine p={pIn} out={pOut} pad={0.05}>
                  <div
                    style={{
                      ...display,
                      fontSize: wordSize * fit,
                      color: brand.ink,
                      lineHeight: 1,
                    }}
                  >
                    {w}
                  </div>
                </MaskLine>
              </div>
            )
          })}
        </div>
        {/* step counter: 01 to 04 */}
        <div style={{ marginBlockStart: 28, display: 'flex', gap: 14 }}>
          {words.map((_, i) => (
            <div
              key={i}
              style={{
                width: 54,
                height: 3,
                background: brand.ink,
                opacity: f >= at(i) - 2 ? 0.9 : 0.18,
              }}
            />
          ))}
        </div>
      </div>
      {/* the page */}
      <div
        style={{
          position: 'absolute',
          insetInlineStart: px,
          insetBlockStart: py,
          width: pw,
          height: ph,
          transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
          transformOrigin: '50% 50%',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: world.on.night,
            opacity: tw(f, at(2) - 2, at(2) + 6),
          }}
        />
        {/* understand: the grid */}
        <svg width={pw} height={ph} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {Array.from({ length: (portrait ? 4 : 12) + 1 }, (_, i) => {
            const x = (i * pw) / (portrait ? 4 : 12)
            return (
              <line
                key={i}
                x1={x}
                y1={-40}
                x2={x}
                y2={-40 + (ph + 80) * clamp(grid * 1.2 - i * 0.02)}
                stroke={brand.ink}
                strokeOpacity={0.3 * (1 - fill(4))}
                strokeWidth={1}
              />
            )
          })}
          {Array.from({ length: 140 }, (_, i) => {
            const x = ((i * 37) % 100) / 100
            const y = ((i * 61) % 100) / 100
            return (
              <rect
                key={`d${i}`}
                x={x * pw}
                y={y * ph}
                width={2}
                height={2}
                fill={brand.ink}
                opacity={0.35 * grid * (1 - wire(0))}
              />
            )
          })}
          {/* define: wireframe boxes */}
          {blocks.map((b, i) => {
            const p = wire(i)
            if (p <= 0) return null
            const [x, y, w, h] = b.r.map((n) => n * k) as unknown as [
              number,
              number,
              number,
              number,
            ]
            const o = 1 - fill(i)
            return (
              <g key={i} opacity={o}>
                <rect
                  x={x}
                  y={y}
                  width={w * p}
                  height={h}
                  fill="none"
                  stroke={brand.ink}
                  strokeOpacity={0.7}
                  strokeWidth={1.5}
                />
                <path
                  d={`M${x} ${y} L${x + w * p} ${y + h} M${x + w * p} ${y} L${x} ${y + h}`}
                  stroke={brand.ink}
                  strokeOpacity={0.2}
                  strokeWidth={1}
                />
              </g>
            )
          })}
        </svg>
        {/* design: the real page, block by block, then whole */}
        {blocks.map((b, i) => {
          const p = fill(i)
          if (p <= 0) return null
          const [x, y, w, h] = b.r
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                insetInlineStart: x * k,
                insetBlockStart: y * k,
                clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`,
                transform: b.cta && pressed > 0 ? `scale(${1 - pressed * 0.05})` : undefined,
              }}
            >
              <Crop src={src} region={b.r} width={w * k} />
            </div>
          )
        })}
        <div style={{ position: 'absolute', inset: 0, opacity: tw(f, at(3) + 8, launch - 4) }}>
          <Crop src={src} width={pw} />
        </div>
        {/* build: code at the edges */}
        {code > 0 ? (
          <div
            style={{
              position: 'absolute',
              insetInlineStart: portrait ? 0 : -330,
              insetBlockStart: portrait ? ph + 30 : ph * 0.12,
              width: portrait ? pw : 300,
              fontFamily: DISPLAY,
              fontSize: portrait ? 22 : 17,
              lineHeight: 1.7,
              color: brand.ink,
              whiteSpace: 'pre',
              opacity: code * (1 - go),
              clipPath: `inset(0 0 ${(1 - code) * 100}% 0)`,
            }}
          >
            {[...CODE[2]!, ...CODE[4]!, ...CODE[3]!].slice(0, portrait ? 4 : 7).map((l, i) => (
              <div key={i} style={{ opacity: 0.4 + (i % 2) * 0.4 }}>
                {l.length > 34 ? `${l.slice(0, 33)}…` : l}
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {cursorO > 0 ? (
        <div
          style={{
            position: 'absolute',
            insetInlineStart: cursorPos.x,
            insetBlockStart: cursorPos.y,
            opacity: cursorO,
          }}
        >
          <Cursor size={portrait ? 46 : 36} pressed={pressed} />
        </div>
      ) : null}
      {/* the click: one ring */}
      {f >= click && f < click + 10 ? (
        <div
          style={{
            position: 'absolute',
            insetInlineStart: ctaPos.x - 30,
            insetBlockStart: ctaPos.y - 30,
            width: 60,
            height: 60,
            borderRadius: 99,
            border: `2px solid ${world.on.cream}`,
            opacity: 1 - (f - click) / 10,
            transform: `scale(${0.4 + (f - click) / 8})`,
          }}
        />
      ) : null}
    </AbsoluteFill>
  )
}
