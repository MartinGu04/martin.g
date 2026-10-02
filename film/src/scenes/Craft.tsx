/**
 * 06 DESIGN + ENGINEERING. One object, four words, and each word causes the change: it
 * sweeps across the frame at the mark's diagonal and leaves the next stage behind it.
 *   UNDERSTAND.  the real world becomes a question: a grid, a field, a sketch
 *   DEFINE.      the sketch becomes structure: every block of the page
 *   DESIGN.      structure becomes the real page, block by block
 *   BUILD.       code at the edges, one click, and it is live
 * Then the live page takes the frame and the camera goes through it (the world scene).
 */
import type { ReactNode } from 'react'
import { AbsoluteFill } from 'remotion'
import { assets } from '../config/assets'
import { copy } from '../config/copy'
import { brand, world } from '../config/palette'
import { s } from '../config/timeline'
import { DIAGONAL } from '../brand/geometry'
import { ease, mix, tw } from '../lib/anim'
import { Crop } from '../components/media'
import { CODE } from '../components/Fragments'
import { Cursor } from '../components/MiMaMo'
import { display } from '../components/Type'
import { DISPLAY } from '../lib/fonts'
import { BLOCKS } from './frame'
import { PhotoCover } from './Outcome'
import type { SceneProps } from './types'

export function craftPage(portrait: boolean, W: number, H: number) {
  const src = portrait ? assets.on.mobile : assets.on.home
  const pw = portrait ? 600 : 1000
  const ph = (pw * src.h) / src.w
  const px = portrait ? (W - pw) / 2 : W - pw - 110
  const py = portrait ? H - ph - 330 : (H - ph) / 2 + 30
  return { src, pw, ph, px, py, k: pw / src.w }
}

export function Craft({ v, f }: SceneProps) {
  const c = v.cues
  const portrait = v.fmt === 'portrait'
  const W = v.width
  const H = v.height
  const p0 = s(c.process)
  const live = s(c.live)
  const step = (live - p0) / 4
  const at = (i: number) => p0 + i * step
  const pg = craftPage(portrait, W, H)
  const blocks = BLOCKS[v.fmt]

  // The sweep for word i: a slanted edge crossing the whole frame, left to right.
  const slant = (H / 2) * DIAGONAL * 0.6
  const sweep = (i: number) => tw(f, at(i) - 6, at(i) + 8, ease.mask)
  const edgeX = (p: number) => mix(-slant - 40, W + slant + 40, p)
  const clipFor = (p: number) =>
    p >= 1
      ? undefined
      : `polygon(-5% -5%, ${edgeX(p) + slant}px -5%, ${edgeX(p) - slant}px 105%, -5% 105%)`

  const wordSize = portrait ? 132 : 150
  const Word = ({ text }: { text: string }) => {
    const maxW = portrait ? 940 : 640
    const fit = Math.min(1, maxW / (text.length * wordSize * 0.8))
    return (
      <div
        style={{
          position: 'absolute',
          insetInlineStart: portrait ? 70 : 110,
          insetBlockStart: portrait ? 300 : H / 2 - wordSize * 0.5,
          ...display,
          fontSize: wordSize * fit,
          color: brand.ink,
          lineHeight: 1,
        }}
      >
        {text}
      </div>
    )
  }
  const Steps = ({ n }: { n: number }) => (
    <div
      style={{
        position: 'absolute',
        insetInlineStart: portrait ? 72 : 112,
        insetBlockStart: portrait ? 300 + wordSize * 1.15 : H / 2 + wordSize * 0.62,
        display: 'flex',
        gap: 14,
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{ width: 54, height: 3, background: brand.ink, opacity: i <= n ? 0.9 : 0.18 }}
        />
      ))}
    </div>
  )
  const Page = ({ children, bg }: { children: ReactNode; bg?: string }) => (
    <div
      style={{
        position: 'absolute',
        insetInlineStart: pg.px,
        insetBlockStart: pg.py,
        width: pg.pw,
        height: pg.ph,
        background: bg,
        overflow: 'visible',
      }}
    >
      {children}
    </div>
  )
  const box = (r: readonly number[]) => r.map((n) => n * pg.k) as [number, number, number, number]

  // Stage 1: understand (grid, dots, a rough sketch)
  const s1 = (
    <AbsoluteFill style={{ background: world.graphite.bg }}>
      <Page>
        <svg width={pg.pw} height={pg.ph} style={{ overflow: 'visible' }}>
          <rect
            x={0}
            y={0}
            width={pg.pw}
            height={pg.ph}
            fill="none"
            stroke={brand.ink}
            strokeOpacity={0.45}
            strokeDasharray="6 8"
          />
          {Array.from({ length: (portrait ? 4 : 12) + 1 }, (_, i) => (
            <line
              key={i}
              x1={(i * pg.pw) / (portrait ? 4 : 12)}
              y1={-60}
              x2={(i * pg.pw) / (portrait ? 4 : 12)}
              y2={pg.ph + 60}
              stroke={brand.ink}
              strokeOpacity={0.12}
            />
          ))}
          {Array.from({ length: 160 }, (_, i) => (
            <rect
              key={`d${i}`}
              x={(((i * 37) % 100) / 100) * pg.pw}
              y={(((i * 61) % 100) / 100) * pg.ph}
              width={2}
              height={2}
              fill={brand.ink}
              opacity={0.3}
            />
          ))}
          {blocks.slice(1, 6).map((r, i) => {
            const [x, y, w, h] = box(r)
            const j = (n: number) => n + Math.sin(i * 7 + n) * 6
            return (
              <path
                key={`s${i}`}
                d={`M${j(x)} ${j(y)} L${j(x + w)} ${y + 3} L${x + w - 2} ${j(y + h)} L${j(x) + 4} ${y + h + 2} Z`}
                fill="none"
                stroke={brand.light}
                strokeOpacity={0.55}
                strokeWidth={1.6}
              />
            )
          })}
        </svg>
      </Page>
      <Word text={copy.process[0]} />
      <Steps n={0} />
    </AbsoluteFill>
  )
  // Stage 2: define (the page's real blocks, as structure)
  const s2 = (
    <AbsoluteFill style={{ background: world.graphite.bg }}>
      <Page>
        <svg width={pg.pw} height={pg.ph} style={{ overflow: 'visible' }}>
          <rect
            x={0.75}
            y={0.75}
            width={pg.pw - 1.5}
            height={pg.ph - 1.5}
            fill="none"
            stroke={brand.ink}
            strokeOpacity={0.6}
            strokeWidth={1.5}
          />
          {blocks.map((r, i) => {
            const [x, y, w, h] = box(r)
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill="rgba(245,243,238,0.04)"
                  stroke={brand.ink}
                  strokeOpacity={0.7}
                  strokeWidth={1.3}
                />
                <path
                  d={`M${x} ${y} L${x + w} ${y + h} M${x + w} ${y} L${x} ${y + h}`}
                  stroke={brand.ink}
                  strokeOpacity={0.18}
                />
              </g>
            )
          })}
        </svg>
      </Page>
      <Word text={copy.process[1]} />
      <Steps n={1} />
    </AbsoluteFill>
  )
  // Stage 3: design (the real page arrives block by block)
  const s3 = (
    <AbsoluteFill style={{ background: world.graphite.bg }}>
      <Page bg={world.on.night}>
        {blocks.map((r, i) => {
          const p = tw(f, at(2) + i * 1.4, at(2) + 6 + i * 1.4, ease.mask)
          const [x, y, w] = box(r)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                insetInlineStart: x,
                insetBlockStart: y,
                clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`,
              }}
            >
              <Crop src={pg.src} region={r} width={w} />
            </div>
          )
        })}
        <div style={{ position: 'absolute', inset: 0, opacity: tw(f, at(2) + 12, at(3) - 4) }}>
          <Crop src={pg.src} width={pg.pw} />
        </div>
      </Page>
      <Word text={copy.process[2]} />
      <Steps n={2} />
    </AbsoluteFill>
  )
  // Stage 4: build (code at the edge, a click, live)
  const cta = blocks[blocks.length - (portrait ? 1 : 2)]!
  const [cx, cy, cw, ch] = box(cta)
  const click = at(3) + 8
  const pressed = tw(f, click - 2, click, ease.out) * (1 - tw(f, click + 2, click + 5))
  const goLive = tw(f, live - 6, live + 4, ease.in)
  const fill = Math.max(W / pg.pw, H / pg.ph)
  const scale = mix(1, fill, goLive)
  const tx = (W / 2 - (pg.px + pg.pw / 2)) * goLive
  const ty = (H / 2 - (pg.py + pg.ph / 2)) * goLive
  const s4 = (
    <AbsoluteFill style={{ background: world.graphite.bg }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 1 - goLive }}>
        <Word text={copy.process[3]} />
        <Steps n={3} />
      </div>
      <div
        style={{
          position: 'absolute',
          insetInlineStart: pg.px,
          insetBlockStart: pg.py,
          width: pg.pw,
          height: pg.ph,
          transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
          transformOrigin: '50% 50%',
        }}
      >
        <Crop src={pg.src} width={pg.pw} />
        <div
          style={{
            position: 'absolute',
            insetInlineStart: cx,
            insetBlockStart: cy,
            width: cw,
            height: ch,
            transform: `scale(${1 - pressed * 0.05})`,
            overflow: 'hidden',
          }}
        >
          <Crop src={pg.src} region={cta} width={cw} />
        </div>
        <div
          style={{
            position: 'absolute',
            insetInlineStart: portrait ? 0 : 24,
            insetBlockStart: portrait ? pg.ph + 26 : pg.ph * 0.62,
            padding: portrait ? 0 : 18,
            background: portrait ? undefined : 'rgba(18,18,18,0.88)',
            fontFamily: DISPLAY,
            fontSize: portrait ? 20 : 15,
            lineHeight: 1.7,
            color: brand.ink,
            whiteSpace: 'pre',
            opacity: (1 - goLive) * tw(f, at(3), at(3) + 6),
            clipPath: `inset(0 0 ${(1 - tw(f, at(3), at(3) + 8)) * 100}% 0)`,
          }}
        >
          {[...CODE[2]!, ...CODE[4]!].slice(0, 4).map((l, i) => (
            <div key={i} style={{ opacity: 0.45 + (i % 2) * 0.4 }}>
              {l}
            </div>
          ))}
        </div>
      </div>
      {f >= at(3) && f < click + 10 ? (
        <div
          style={{
            position: 'absolute',
            insetInlineStart:
              pg.px + cx + cw * 0.4 + (1 - tw(f, at(3), click - 2, ease.inOut)) * 220,
            insetBlockStart:
              pg.py + cy + ch * 0.6 + (1 - tw(f, at(3), click - 2, ease.inOut)) * 160,
            opacity: 1 - tw(f, click + 5, click + 9),
          }}
        >
          <Cursor size={portrait ? 44 : 34} pressed={pressed} />
        </div>
      ) : null}
      {f >= click && f < click + 10 ? (
        <div
          style={{
            position: 'absolute',
            insetInlineStart: pg.px + cx + cw * 0.4 - 30,
            insetBlockStart: pg.py + cy + ch * 0.6 - 30,
            width: 60,
            height: 60,
            borderRadius: 60,
            border: `2px solid ${world.on.cream}`,
            opacity: 1 - (f - click) / 10,
            transform: `scale(${0.4 + (f - click) / 8})`,
          }}
        />
      ) : null}
    </AbsoluteFill>
  )

  const stages = [s1, s2, s3, s4]
  return (
    <AbsoluteFill>
      {/* the real place, from the outcome: the first word sweeps it away */}
      <AbsoluteFill>
        <PhotoCover v={v} f={f} w={W} h={H} />
      </AbsoluteFill>
      {stages.map((node, i) => {
        const p = sweep(i)
        if (p <= 0) return null
        const next = i < 3 ? sweep(i + 1) : 0
        if (next >= 1) return null
        return (
          <AbsoluteFill key={i} style={{ clipPath: clipFor(p) }}>
            {node}
          </AbsoluteFill>
        )
      })}
      {/* the edge itself: a hairline at the mark's angle, carrying the change */}
      {[0, 1, 2, 3].map((i) => {
        const p = sweep(i)
        if (p <= 0 || p >= 1) return null
        const x = edgeX(p)
        return (
          <svg key={`e${i}`} width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            <line
              x1={x + slant}
              y1={-20}
              x2={x - slant}
              y2={H + 20}
              stroke={brand.light}
              strokeWidth={2}
              strokeOpacity={0.9}
            />
          </svg>
        )
      })}
    </AbsoluteFill>
  )
}
