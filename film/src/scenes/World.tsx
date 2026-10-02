/**
 * 07 THE MARTIN.G WORLD → 08 MAKE IT REAL. The live page takes the frame and the camera
 * goes through it, into a corridor of all the work, passing screens, photographs, code,
 * type and geometry at speed. Then it decelerates, the roll resolves, and everything
 * aligns: the last pieces shrink into cells, hundreds more stream in from the depth, and
 * only when the last cell locks does the shape read: the MG symbol, made of the work. On the
 * way, one Hebrew line bridges to the ending: מהרעיון. עד הדבר האמיתי.
 * It turns to light; silence; the real symbol takes its place (the signature scene).
 */
import { AbsoluteFill } from 'remotion'
import { assets } from '../config/assets'
import { brand } from '../config/palette'
import { s } from '../config/timeline'
import { Plane, Stage } from '../lib/camera'
import { drift, ease, keys, mix, rng, tw } from '../lib/anim'
import { Crop, Preload } from '../components/media'
import { TileBody, TILE_CYCLE } from '../components/Tiles'
import { symbolAspect } from '../components/Mark'
import { DIAGONAL } from '../brand/geometry'
import { copy } from '../config/copy'
import { CaptionAt, HeLine } from '../components/Caption'
import cellsData from '../generated/monogram-cells.json'
import type { SceneProps } from './types'

/** Where the symbol lands, on screen: the same size as the opening's impact. */
export const MOSAIC = { landscape: { w: 700, y: -40 }, portrait: { w: 780, y: -150 } }

const ATLAS = [
  assets.mm.dashboard,
  assets.on.venue,
  assets.on.home,
  assets.mm.week,
  assets.on.patisserie,
  assets.mm.admin,
  assets.on.story,
  assets.mm.mobile,
  assets.on.symbol,
]

const Z_END = -13000

function corridor(portrait: boolean) {
  const r = rng(portrait ? 77 : 66)
  return Array.from({ length: 34 }, (_, i) => {
    const side = i % 2 ? 1 : -1
    const z = -900 - i * 420 - r() * 200
    const w = portrait ? 520 + r() * 260 : 640 + r() * 360
    return {
      i,
      kind: TILE_CYCLE[(i * 5) % TILE_CYCLE.length]!,
      // laid along the chevron of the M: two rails at the mark's diagonal
      x: portrait ? side * (240 + r() * 360) : side * (360 + r() * 720),
      y: 0,
      z,
      w,
      h: w * (portrait ? 16 / 9 : 9 / 16) * (portrait ? 0.62 : 1),
      ry: -side * (18 + r() * 22),
      rz: (r() - 0.5) * 10,
    }
  })
}
const COR = {
  landscape: corridor(false).map((t) => ({
    ...t,
    y: -(Math.abs(t.x) - 360) * DIAGONAL * 0.9 + 260,
  })),
  portrait: corridor(true).map((t, i) => ({
    ...t,
    y: -(Math.abs(t.x) - 240) * DIAGONAL * 1.6 + 300 + (i % 3) * 220,
  })),
}

const CELLS = (() => {
  const r = rng(12)
  return cellsData.cells.map(([c, row], i) => ({
    c: c!,
    r: row!,
    src: i % ATLAS.length,
    ox: r(),
    oy: r(),
    sx: (r() - 0.5) * 3200,
    sy: (r() - 0.5) * 2000,
    sz: -600 - r() * 5200,
    delay: r(),
  }))
})()

export function World({ v, f }: SceneProps) {
  const c = v.cues
  const portrait = v.fmt === 'portrait'
  const W = portrait ? 1080 : 1920
  const H = portrait ? 1920 : 1080
  const launch = s(c.live)
  const align = s(c.align)
  const formed = s(c.formed)
  const silence = s(c.silence)
  const symbol = s(c.symbol)
  const m = MOSAIC[v.fmt]
  const cell = m.w / cellsData.cols
  const mh = m.w / symbolAspect

  const cam = {
    x: keys(f, [
      [launch, 0],
      [align, 0],
    ]),
    y: keys(f, [
      [launch, 0],
      [align, 0],
    ]),
    z: keys(f, [
      [launch - 6, 0],
      [launch + 10, -900, ease.in],
      [align - 6, Z_END + 400, ease.linear],
      [align + 8, Z_END - 60, ease.out],
      [formed, Z_END, ease.inOut],
      [symbol, Z_END + 30, ease.linear],
    ]),
    rz: keys(f, [
      [launch, 0],
      [launch + 20, portrait ? -9 : 7, ease.inOut],
      [align - 4, portrait ? 6 : -5, ease.inOut],
      [formed, 0, ease.inOut],
    ]),
    ry: keys(f, [
      [launch, 0],
      [launch + 24, portrait ? 4 : 6, ease.inOut],
      [align, 0, ease.inOut],
    ]),
    dof: 3 * (1 - tw(f, align, align + 10)),
    focusZ: 0,
  }
  // Focus rides just ahead of the lens through the corridor, then lands on the symbol.
  cam.focusZ = f < align ? cam.z - 500 : Z_END
  cam.x += drift(f, 61, 12) * (1 - tw(f, align - 10, align))
  cam.y += drift(f, 62, 8) * (1 - tw(f, align - 10, align))

  const light = tw(f, formed - 2, silence, ease.inOut)
  const gone = tw(f, symbol, symbol + 3, ease.linear)
  const page = portrait ? assets.on.mobile : assets.on.home
  const pageFill = Math.max(W / page.w, H / page.h)

  return (
    <AbsoluteFill style={{ background: brand.black }}>
      <Preload srcs={ATLAS.map((a) => a.src)} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 55% at 50% 48%, rgba(255,244,230,${0.05 + 0.07 * light}), rgba(255,244,230,0) 70%)`,
        }}
      />
      <Stage cam={cam}>
        {/* the live page we leave through */}
        <Plane z={0} w={page.w * pageFill} h={page.h * pageFill}>
          <Crop src={page} width={page.w * pageFill} />
        </Plane>
        {COR[v.fmt].map((t) => {
          // The last pieces of the corridor fly into the symbol instead of passing by.
          const intoMark = t.z < Z_END + 1600
          const target = CELLS[(t.i * 37) % CELLS.length]!
          const tx = (target.c + 0.5) * cell - m.w / 2
          const ty = (target.r + 0.5) * cell - mh / 2 + m.y
          const p = intoMark ? tw(f, align - 2 + (t.i % 6), align + 12 + (t.i % 6), ease.inOut) : 0
          const face = tw(f, align - 10, align + 4, ease.inOut)
          const k = mix(1, cell / t.w, p)
          return (
            <Plane
              key={t.i}
              x={mix(t.x, tx, p)}
              y={mix(t.y, ty, p)}
              z={mix(t.z, Z_END, p)}
              ry={t.ry * (1 - face)}
              rz={t.rz * (1 - face)}
              w={t.w}
              h={t.h}
              scale={k}
              opacity={1 - gone}
            >
              <div style={{ position: 'relative', width: t.w, height: t.h, overflow: 'hidden' }}>
                <TileBody kind={t.kind} w={t.w} h={t.h} fmt={v.fmt} seed={t.i} />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: brand.ink,
                    opacity: light * 0.92,
                  }}
                />
              </div>
            </Plane>
          )
        })}
        {/* the symbol's cells, streaming in from the depth */}
        {f >= align - 8
          ? CELLS.map((ce, i) => {
              const a = align - 6 + ce.delay * 22
              const p = tw(f, a, a + 10, ease.snap)
              if (p <= 0) return null
              const tx = (ce.c + 0.5) * cell - m.w / 2
              const ty = (ce.r + 0.5) * cell - mh / 2 + m.y
              const src = ATLAS[ce.src]!
              const tile = cell * 1.02
              return (
                <Plane
                  key={`c${i}`}
                  x={mix(ce.sx, tx, p)}
                  y={mix(ce.sy, ty, p)}
                  z={mix(Z_END + ce.sz, Z_END, p)}
                  w={tile}
                  h={tile}
                  sharp
                  opacity={(1 - gone) * Math.min(1, p * 3)}
                >
                  <div
                    style={{
                      width: tile,
                      height: tile,
                      backgroundImage: `url(${src.src})`,
                      backgroundSize: `${tile * 9}px auto`,
                      backgroundPosition: `${ce.ox * 100}% ${ce.oy * 100}%`,
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: brand.ink,
                        opacity: light * 0.94,
                      }}
                    />
                  </div>
                </Plane>
              )
            })
          : null}
      </Stage>
      {/* the bridge: from the idea, to the real thing */}
      <CaptionAt y={portrait ? 560 : 380}>
        <HeLine fmt={v.fmt} text={copy.bridge[0]} f={f} at={s(c.bridgeHe)} out={align + 4} />
      </CaptionAt>
      <CaptionAt y={portrait ? 650 : 460}>
        <HeLine fmt={v.fmt} text={copy.bridge[1]} f={f} at={s(c.bridgeHe) + 8} out={align + 6} />
      </CaptionAt>
    </AbsoluteFill>
  )
}
