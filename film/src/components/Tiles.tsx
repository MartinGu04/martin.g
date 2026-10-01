/**
 * The tiles of the MARTIN.G system: every discipline as one surface, so the wall, the
 * flight and the final mosaic are built from the real work (screens, photographs, code,
 * geometry, type, wireframes), never from decoration.
 */
import type { ReactNode } from 'react'
import { assets, type Source } from '../config/assets'
import { brand, world } from '../config/palette'
import type { Format } from '../config/timeline'
import { CODE } from './Fragments'
import { TopologyView, topology } from './Geometry'
import { Crop } from './media'
import { display } from './Type'
import { DISPLAY } from '../lib/fonts'

export type TileKind =
  | 'mm-dashboard'
  | 'mm-admin'
  | 'mm-manager'
  | 'mm-week'
  | 'mm-mobile'
  | 'on-home'
  | 'on-story'
  | 'on-venue'
  | 'on-patisserie'
  | 'on-symbol'
  | 'on-mobile'
  | 'code'
  | 'geo'
  | 'type'
  | 'wire'

export const TILE_CYCLE: TileKind[] = [
  'mm-dashboard',
  'on-home',
  'geo',
  'code',
  'on-venue',
  'mm-week',
  'type',
  'on-story',
  'mm-admin',
  'wire',
  'on-patisserie',
  'mm-manager',
  'on-symbol',
  'geo',
  'mm-mobile',
  'on-mobile',
  'code',
  'on-venue',
]

/** A source cropped to fill a w × h tile (center crop), never stretched. */
function Cover({ src, w, h, focus = 0.5 }: { src: Source; w: number; h: number; focus?: number }) {
  const k = Math.max(w / src.w, h / src.h)
  const rw = w / k
  const rh = h / k
  const region = [(src.w - rw) * focus, (src.h - rh) * 0.5, rw, rh] as const
  return <Crop src={src} region={region} width={w} />
}

const GEO = { landscape: topology(1920, 1080, 9, 5, 31), portrait: topology(1080, 1920, 5, 9, 31) }

function Centered({
  bg,
  children,
  w,
  h,
}: {
  bg: string
  children: ReactNode
  w: number
  h: number
}) {
  return (
    <div
      style={{
        width: w,
        height: h,
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {children}
    </div>
  )
}

export function TileBody({
  kind,
  w,
  h,
  fmt,
  seed = 0,
}: {
  kind: TileKind
  w: number
  h: number
  fmt: Format
  seed?: number
}) {
  const u = Math.min(w, h) / 1080
  switch (kind) {
    case 'mm-dashboard':
      return <Cover src={assets.mm.dashboard} w={w} h={h} />
    case 'mm-admin':
      return <Cover src={assets.mm.admin} w={w} h={h} focus={0.8} />
    case 'mm-manager':
      return <Cover src={assets.mm.manager} w={w} h={h} focus={0.9} />
    case 'mm-week':
      return (
        <Centered bg={world.miMaMo.bg} w={w} h={h}>
          <Crop src={assets.mm.weekView} width={w * 0.92} />
        </Centered>
      )
    case 'mm-mobile':
      return (
        <Centered bg={world.miMaMo.bg} w={w} h={h}>
          <Crop src={assets.mm.mobile} width={h * 0.45} />
        </Centered>
      )
    case 'on-home':
      return <Cover src={assets.on.home} w={w} h={h} focus={0.7} />
    case 'on-story':
      return <Cover src={assets.on.story} w={w} h={h} focus={0.8} />
    case 'on-venue':
      return <Cover src={assets.on.venue} w={w} h={h} />
    case 'on-patisserie':
      return <Cover src={assets.on.patisserie} w={w} h={h} />
    case 'on-symbol':
      return (
        <Centered bg={world.on.night} w={w} h={h}>
          <Crop src={assets.on.symbol} width={Math.min(w, h * 1.6) * 0.5} />
        </Centered>
      )
    case 'on-mobile':
      return (
        <Centered bg={world.on.cream} w={w} h={h}>
          <Crop
            src={assets.on.mobile}
            width={h * 0.42}
            style={{ boxShadow: '0 30px 80px rgba(61,26,30,0.35)' }}
          />
        </Centered>
      )
    case 'code': {
      const lines = [
        ...CODE[seed % CODE.length]!,
        ...CODE[(seed + 2) % CODE.length]!,
        ...CODE[(seed + 4) % CODE.length]!,
      ]
      return (
        <div
          style={{
            width: w,
            height: h,
            background: brand.graphite,
            padding: 90 * u,
            fontFamily: DISPLAY,
            fontSize: 34 * u,
            lineHeight: 1.7,
            color: brand.ink,
            whiteSpace: 'pre',
            overflow: 'hidden',
          }}
        >
          {lines.map((l, i) => (
            <div key={i}>
              <span style={{ opacity: 0.3, marginInlineEnd: 40 * u }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ opacity: i % 3 === 0 ? 1 : 0.7 }}>{l}</span>
            </div>
          ))}
        </div>
      )
    }
    case 'geo':
      return (
        <div style={{ width: w, height: h, background: world.defense.bg }}>
          <TopologyView topo={GEO[fmt]} w={w} h={h} t={seed} pulses={4} stroke={2.4} node={14} />
        </div>
      )
    case 'type':
      return (
        <Centered bg={world.bone.bg} w={w} h={h}>
          <div
            style={{
              ...display,
              fontSize: 300 * u * (fmt === 'portrait' ? 0.7 : 1),
              color: world.bone.ink,
              lineHeight: 0.86,
            }}
          >
            {fmt === 'portrait' ? (
              <>
                <div>PRO</div>
                <div>DUCT</div>
              </>
            ) : (
              'PRODUCT'
            )}
          </div>
        </Centered>
      )
    case 'wire':
      return (
        <div style={{ width: w, height: h, background: world.graphite.bg, position: 'relative' }}>
          <svg width={w} height={h}>
            {Array.from({ length: 13 }, (_, i) => (
              <line
                key={i}
                x1={(i * w) / 12}
                y1={0}
                x2={(i * w) / 12}
                y2={h}
                stroke={brand.ink}
                strokeOpacity={0.08}
              />
            ))}
            {[
              [0.08, 0.06, 0.84, 0.05],
              [0.55, 0.2, 0.3, 0.22],
              [0.3, 0.48, 0.55, 0.16],
              [0.45, 0.68, 0.4, 0.06],
              [0.58, 0.8, 0.27, 0.07],
            ].map(([x, y, ww, hh], i) => (
              <g key={i}>
                <rect
                  x={x! * w}
                  y={y! * h}
                  width={ww! * w}
                  height={hh! * h}
                  fill="none"
                  stroke={brand.ink}
                  strokeOpacity={0.55}
                  strokeWidth={2}
                />
                <path
                  d={`M${x! * w} ${y! * h} L${(x! + ww!) * w} ${(y! + hh!) * h} M${(x! + ww!) * w} ${y! * h} L${x! * w} ${(y! + hh!) * h}`}
                  stroke={brand.ink}
                  strokeOpacity={0.18}
                  strokeWidth={1.5}
                />
              </g>
            ))}
          </svg>
        </div>
      )
  }
}
