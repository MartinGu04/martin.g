/**
 * 06 THE SYSTEM (hero moment one). The product we were inside is one tile. The camera pulls
 * back and keeps pulling: a wall of everything MARTIN.G builds, screens, photographs,
 * code, geometry, type, wireframes, in relief. BUILT FOR REAL WORK. lands in front of it;
 * the camera then flies through the words to one dark tile, the defense systems.
 */
import { AbsoluteFill } from 'remotion'
import { copy } from '../config/copy'
import { brand } from '../config/palette'
import { s } from '../config/timeline'
import { Plane, Stage } from '../lib/camera'
import { drift, ease, keys, rng, tw } from '../lib/anim'
import { TileBody, TILE_CYCLE } from '../components/Tiles'
import { display, MaskLine } from '../components/Type'
import { KeyLight } from '../components/Atmosphere'
import { FINAL, ProductWorld } from './Product'
import { productLayout } from './productLayout'
import { SystemA } from './Defense'
import type { SceneProps } from './types'

export function wallGrid(portrait: boolean) {
  const W = portrait ? 1080 : 1920
  const H = portrait ? 1920 : 1080
  const gap = portrait ? 90 : 100
  const cols = portrait ? 3 : 4
  const rows = portrait ? 3 : 4
  const r = rng(portrait ? 8 : 4)
  const tiles: {
    col: number
    row: number
    x: number
    y: number
    z: number
    kind: (typeof TILE_CYCLE)[number] | 'product' | 'defense'
    seed: number
  }[] = []
  let k = 0
  for (let row = -rows; row <= rows; row++) {
    for (let col = -cols; col <= cols; col++) {
      const isProduct = row === 0 && col === 0
      const isDefense = portrait ? row === -1 && col === 1 : row === -1 && col === 2
      tiles.push({
        col,
        row,
        x: col * (W + gap),
        y: row * (H + gap),
        z: isProduct || isDefense ? 0 : Math.round((r() - 0.5) * 520),
        kind: isProduct
          ? 'product'
          : isDefense
            ? 'defense'
            : TILE_CYCLE[(k++ * 7 + (row + 9) * 3) % TILE_CYCLE.length]!,
        seed: k,
      })
    }
  }
  return { W, H, tiles, defense: tiles.find((t) => t.kind === 'defense')! }
}

export function Wall({ v, f }: SceneProps) {
  const c = v.cues
  const portrait = v.fmt === 'portrait'
  const { W, H, tiles, defense } = wallGrid(portrait)
  const pullBack = s(c.pullBack)
  const realWork = s(c.realWork)
  const dive = s(c.dive)
  const arrive = s(c.systemA)
  const l = productLayout(v.fmt)

  const far = portrait ? 9800 : 8600
  const cam = {
    x: keys(f, [
      [pullBack, 0],
      [realWork, portrait ? 120 : -380, ease.scene],
      [dive, portrait ? 60 : -300, ease.linear],
      [arrive, defense.x, ease.arrive],
    ]),
    y: keys(f, [
      [pullBack, 0],
      [realWork, portrait ? 240 : 160, ease.scene],
      [dive, portrait ? 200 : 120, ease.linear],
      [arrive, defense.y, ease.arrive],
    ]),
    z: keys(f, [
      [pullBack, portrait ? 150 : 160],
      [realWork, far, ease.scene],
      [dive, far - 500, ease.linear],
      [arrive, 0, ease.arrive],
    ]),
    rx: keys(f, [
      [pullBack, 0],
      [realWork, portrait ? 4 : 7, ease.scene],
      [dive, portrait ? 5 : 8],
      [arrive, 0, ease.arrive],
    ]),
    ry: keys(f, [
      [pullBack, 0],
      [realWork, portrait ? 6 : -12, ease.scene],
      [dive, portrait ? 7 : -10],
      [arrive, 0, ease.arrive],
    ]),
    rz: keys(f, [
      [pullBack, 0],
      [realWork, portrait ? -2 : 1.5, ease.scene],
      [arrive, 0, ease.arrive],
    ]),
  }
  cam.x += drift(f, 31, 20) * tw(f, pullBack, realWork) * (1 - tw(f, dive, arrive))
  cam.y += drift(f, 32, 14) * tw(f, pullBack, realWork) * (1 - tw(f, dive, arrive))

  // The wall dims behind the words, then comes back as the camera dives.
  const dim = 1 - 0.5 * tw(f, realWork - 4, realWork + 4) * (1 - tw(f, dive, dive + 10))
  const typeZ = far - 1400
  const lines = portrait ? ['BUILT', 'FOR', 'REAL', 'WORK.'] : [...copy.realWork]
  const size = portrait ? 411 : 355
  const dist = cam.z + 1613 - typeZ
  const typeScale = dist > 0 ? 1613 / dist : 0
  const typeO = Math.min(1, Math.max(0, (dist - 260) / 500))
  const typeBlur = Math.max(0, typeScale - 1.6) * 6

  return (
    <AbsoluteFill style={{ background: brand.black }}>
      <KeyLight x={38} y={30} size={80} strength={0.08} />
      <Stage cam={cam}>
        {tiles.map((t, i) => {
          // Tiles appear around the product as the camera pulls back, ring by ring.
          const ring = Math.max(Math.abs(t.col), Math.abs(t.row))
          const o = t.kind === 'product' ? 1 : tw(f, pullBack + ring * 2, pullBack + 6 + ring * 3)
          if (o <= 0) return null
          const lit =
            t.kind === 'product' || t.kind === 'defense'
              ? 1
              : 0.62 + 0.38 * Math.abs(Math.sin(i * 1.7))
          return (
            <Plane key={i} x={t.x} y={t.y} z={t.z} w={W} h={H} opacity={o}>
              <div
                style={{
                  position: 'relative',
                  width: W,
                  height: H,
                  overflow: 'hidden',
                  background: brand.graphite,
                }}
              >
                {t.kind === 'product' ? (
                  <ProductTile f={pullBack} l={l} />
                ) : t.kind === 'defense' ? (
                  <SystemA
                    fmt={v.fmt}
                    f={arrive}
                    t={{
                      systemA: arrive,
                      stateChange: s(c.stateChange),
                      systemB: s(c.systemB),
                      structure: s(c.structure),
                      end: s(c.design),
                    }}
                  />
                ) : (
                  <TileBody kind={t.kind} w={W} h={H} fmt={v.fmt} seed={t.seed} />
                )}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: '#000',
                    opacity:
                      (1 - lit * dim) * (t.kind === 'product' ? tw(f, pullBack + 6, realWork) : 1),
                  }}
                />
              </div>
            </Plane>
          )
        })}
      </Stage>
      {/* The words hang in the space between the camera and the wall, square to the lens:
          they grow as the camera pushes and the dive passes straight through them. */}
      {typeScale > 0 && typeO > 0 ? (
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: typeO }}>
          <div
            style={{
              ...display,
              fontSize: size,
              color: brand.ink,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              transform: `scale(${typeScale})`,
              textShadow: '0 20px 80px rgba(0,0,0,0.6)',
              filter: typeBlur > 0.3 ? `blur(${typeBlur}px)` : undefined,
            }}
          >
            {lines.map((line, i) => (
              <MaskLine
                key={i}
                p={tw(f, realWork - 4 + i * 2, realWork + 5 + i * 2, ease.mask)}
                pad={0.04}
              >
                {line}
              </MaskLine>
            ))}
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  )
}

/** The product, frozen in its organized state, as a tile. */
function ProductTile({ f, l }: { f: number; l: ReturnType<typeof productLayout> }) {
  const W = l.fmt === 'portrait' ? 1080 : 1920
  const H = l.fmt === 'portrait' ? 1920 : 1080
  return (
    <div
      style={{
        position: 'relative',
        width: W,
        height: H,
        background: '#0b121c',
        overflow: 'hidden',
      }}
    >
      <Stage cam={{ x: 0, y: 0, z: 0 }} style={{ width: W, height: H }}>
        <ProductWorld l={l} st={FINAL} f={f} explode={0} />
      </Stage>
    </div>
  )
}
