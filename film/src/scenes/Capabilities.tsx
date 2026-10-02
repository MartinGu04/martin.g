/**
 * 03 WHAT MARTIN.G BUILDS. The frame the idea built keeps becoming something else, on the
 * beat, through wipes at the mark's diagonal: a website, a digital product, a brand, a
 * system. One object, never a cut. One Hebrew word names each; then one English line says
 * why: BUILT AROUND REAL NEEDS. The system is left exactly where the proof picks it up.
 */
import type { ReactNode } from 'react'
import { AbsoluteFill } from 'remotion'
import { assets, type Source } from '../config/assets'
import { copy } from '../config/copy'
import { brand, world } from '../config/palette'
import { s, type Format } from '../config/timeline'
import { DIAGONAL } from '../brand/geometry'
import { drift, ease, mix, tw } from '../lib/anim'
import { Crop } from '../components/media'
import { Schedule, scheduleGeom } from '../components/MiMaMo'
import { Campaign, CaptionAt, HeLine } from '../components/Caption'
import { frameGeom } from './frame'
import type { SceneProps } from './types'

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

/** Where the system sits when the proof takes over (shared with Proof). */
export function systemRect(fmt: Format): Rect {
  const w = fmt === 'portrait' ? 940 : 1240
  const g = scheduleGeom(w, fmt === 'portrait' ? 4 : 8)
  return { x: 0, y: fmt === 'portrait' ? -170 : -70, w, h: g.headH + 7 * g.rowH }
}

function rects(fmt: Format) {
  const F = frameGeom(fmt)
  const p = fmt === 'portrait'
  const phoneW = p ? 540 : 330
  return {
    web: F.web as Rect,
    product: { x: 0, y: p ? -170 : -90, w: phoneW, h: (phoneW * 867) / 429 },
    brand: { x: 0, y: p ? -170 : -90, w: p ? 760 : 600, h: p ? 760 : 600 },
    system: systemRect(fmt),
  }
}

function lerpRect(a: Rect, b: Rect, t: number): Rect {
  return { x: mix(a.x, b.x, t), y: mix(a.y, b.y, t), w: mix(a.w, b.w, t), h: mix(a.h, b.h, t) }
}

/** A source, cropped to cover a w × h box (center), never stretched. */
function Cover({ src, w, h, zoom = 1 }: { src: Source; w: number; h: number; zoom?: number }) {
  const k = Math.max(w / src.w, h / src.h) * zoom
  const rw = w / k
  const rh = h / k
  return <Crop src={src} region={[(src.w - rw) / 2, (src.h - rh) / 2, rw, rh]} width={w} />
}

export function Capabilities({ v, f }: SceneProps) {
  const c = v.cues
  const portrait = v.fmt === 'portrait'
  const W = v.width
  const H = v.height
  const F = frameGeom(v.fmt)
  const R = rects(v.fmt)
  const web = s(c.web)
  const product = s(c.product)
  const brandAt = s(c.brand)
  const system = s(c.system)
  const needs = s(c.needs)
  const proof = s(c.proof)

  // The frame morphs into each shape, arriving on the beat.
  const m1 = tw(f, product - 10, product, ease.inOut)
  const m2 = tw(f, brandAt - 10, brandAt, ease.inOut)
  const m3 = tw(f, system - 12, system, ease.inOut)
  let r = lerpRect(R.web, R.product, m1)
  r = lerpRect(r, R.brand, m2)
  r = lerpRect(r, R.system, m3)

  // Contents, each revealed by a slanted wipe at the mark's diagonal.
  const wipe = (at: number) => tw(f, at - 10, at + 2, ease.mask)
  const layers: { key: string; p: number; node: ReactNode; bg: string }[] = [
    {
      key: 'web',
      p: 1,
      bg: world.on.night,
      node: (
        <Cover
          src={portrait ? assets.on.mobile : assets.on.home}
          w={r.w}
          h={r.h}
          zoom={1 + 0.05 * tw(f, web, product, ease.linear)}
        />
      ),
    },
    {
      key: 'product',
      p: wipe(product),
      bg: world.miMaMo.bg,
      node: (
        <Cover
          src={assets.mm.mobile}
          w={r.w}
          h={r.h}
          zoom={1 + 0.03 * tw(f, product, brandAt, ease.linear)}
        />
      ),
    },
    {
      key: 'brand',
      p: wipe(brandAt),
      bg: world.on.night,
      node: (
        <div
          style={{
            width: r.w,
            height: r.h,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Crop
            src={assets.on.symbol}
            width={Math.min(r.w, r.h * 1.6) * mix(0.62, 0.68, tw(f, brandAt, system, ease.linear))}
          />
        </div>
      ),
    },
    {
      key: 'system',
      p: wipe(system),
      bg: 'rgb(21,28,35)',
      node: (
        <div
          style={{
            width: r.w,
            height: r.h,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: R.system.w, transform: `scale(${r.w / R.system.w})` }}>
            <Schedule width={R.system.w} cols={portrait ? 4 : 8} />
          </div>
        </div>
      ),
    },
  ]
  const x0 = W / 2 + r.x - r.w / 2
  const y0 = H / 2 + r.y - r.h / 2
  const settle = tw(f, system + 4, needs, ease.inOut)
  const slant = r.h * DIAGONAL * 0.5
  const shadow = 1 - settle

  return (
    <AbsoluteFill style={{ background: brand.black }}>
      <AbsoluteFill
        style={{ background: world.miMaMo.bg, opacity: tw(f, needs, proof, ease.inOut) }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 55% at 50% 42%, rgba(255,244,230,0.06), rgba(255,244,230,0) 70%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          insetInlineStart: x0 + drift(f, 7, 2) * (1 - settle),
          insetBlockStart: y0 + drift(f, 8, 2) * (1 - settle),
          width: r.w,
          height: r.h,
          overflow: 'hidden',
          boxShadow: `0 40px 120px rgba(0,0,0,${0.55 * shadow})`,
        }}
      >
        {layers.map((L) => {
          if (L.p <= 0) return null
          const edge = mix(-slant - 20, r.w + slant + 20, L.p)
          const clip =
            L.p >= 1
              ? undefined
              : `polygon(${edge + slant}px 0, ${r.w + 40}px 0, ${r.w + 40}px ${r.h}px, ${edge - slant}px ${r.h}px)`
          return (
            <div
              key={L.key}
              style={{ position: 'absolute', inset: 0, background: L.bg, clipPath: clip }}
            >
              {L.node}
            </div>
          )
        })}
        {/* the wipe's edge: a hairline at the diagonal, the mark's own angle */}
        {[product, brandAt, system].map((at) => {
          const p = wipe(at)
          if (p <= 0 || p >= 1) return null
          const edge = mix(-slant - 20, r.w + slant + 20, p)
          return (
            <div
              key={at}
              style={{
                position: 'absolute',
                insetBlock: -20,
                insetInlineStart: edge - 1,
                width: 2,
                background: brand.light,
                opacity: 0.85,
                transform: `skewX(${-Math.atan(DIAGONAL * 0.5 * 2) * (180 / Math.PI) * 0.5}deg)`,
              }}
            />
          )
        })}
      </div>
      <CaptionAt y={F.caption.y}>
        <HeLine fmt={v.fmt} text={copy.builds.web} f={f} at={web - 4} out={product - 8} />
      </CaptionAt>
      <CaptionAt y={F.caption.y}>
        <HeLine fmt={v.fmt} text={copy.builds.product} f={f} at={product} out={brandAt + 4} />
      </CaptionAt>
      <CaptionAt y={portrait ? 330 : 340}>
        <HeLine fmt={v.fmt} text={copy.builds.system} f={f} at={system} out={needs - 8} />
      </CaptionAt>
      <CaptionAt y={portrait ? 300 : 345}>
        <Campaign
          lines={portrait ? ['BUILT AROUND', 'REAL NEEDS.'] : [copy.needs]}
          f={f}
          at={needs}
          out={proof - 8}
          size={portrait ? 88 : 66}
        />
      </CaptionAt>
    </AbsoluteFill>
  )
}
