/**
 * The second half of the proof: the product the camera was inside is one tile. The camera
 * pulls back and keeps pulling: a wall of everything MARTIN.G builds (screens, photographs,
 * code, generated geometry, type, wireframes) in relief. BUILT FOR REAL WORK. hangs in front
 * of it; the camera glides past the confidential systems, alive as geometry only, and dives
 * into the tile where the next idea waits (the outcome scene picks it up exactly there).
 */
import { AbsoluteFill } from 'remotion'
import { copy } from '../config/copy'
import { brand } from '../config/palette'
import { s, type Version } from '../config/timeline'
import { Plane, Stage } from '../lib/camera'
import { drift, ease, keys, rng, tw } from '../lib/anim'
import { TileBody, TILE_CYCLE } from '../components/Tiles'
import { Campaign } from '../components/Caption'
import { KeyLight } from '../components/Atmosphere'
import { FINAL, ProductWorld } from './Product'
import { productLayout } from './productLayout'
import { SystemA } from './Defense'
import { ClutterFrame } from './Outcome'

type Kind = (typeof TILE_CYCLE)[number] | 'product' | 'defense' | 'outcome'

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
    kind: Kind
    seed: number
  }[] = []
  let k = 0
  for (let row = -rows; row <= rows; row++) {
    for (let col = -cols; col <= cols; col++) {
      const special: Kind | null =
        row === 0 && col === 0
          ? 'product'
          : portrait
            ? row === 1 && col === 0
              ? 'defense'
              : row === 2 && col === 0
                ? 'outcome'
                : null
            : row === 0 && col === 1
              ? 'defense'
              : row === 0 && col === 2
                ? 'outcome'
                : null
      tiles.push({
        col,
        row,
        x: col * (W + gap),
        y: row * (H + gap),
        z: special ? 0 : Math.round((r() - 0.5) * 520),
        kind: special ?? TILE_CYCLE[(k++ * 7 + (row + 9) * 3) % TILE_CYCLE.length]!,
        seed: k,
      })
    }
  }
  return { W, H, tiles, outcome: tiles.find((t) => t.kind === 'outcome')! }
}

export function Wall({ v, f }: { v: Version; f: number }) {
  const c = v.cues
  const portrait = v.fmt === 'portrait'
  const { W, H, tiles, outcome } = wallGrid(portrait)
  const pullBack = s(c.pullBack)
  const realWork = s(c.realWork)
  const dive = s(c.dive)
  const arrive = s(c.clutter)
  const l = productLayout(v.fmt)
  const far = portrait ? 9800 : 8600

  const cam = {
    x: keys(f, [
      [pullBack, 0],
      [realWork, portrait ? 60 : -260, ease.scene],
      [dive, portrait ? 120 : 300, ease.inOut],
      [arrive, outcome.x, ease.inOut],
    ]),
    y: keys(f, [
      [pullBack, 0],
      [realWork, portrait ? 300 : 140, ease.scene],
      [dive, portrait ? 900 : 100, ease.inOut],
      [arrive, outcome.y, ease.inOut],
    ]),
    z: keys(f, [
      [pullBack, portrait ? 150 : 160],
      [realWork, far, ease.scene],
      [dive, far - 700, ease.linear],
      [arrive, 0, ease.inOut],
    ]),
    rx: keys(f, [
      [pullBack, 0],
      [realWork, portrait ? 4 : 7, ease.scene],
      [dive, portrait ? 5 : 6],
      [arrive, 0, ease.inOut],
    ]),
    ry: keys(f, [
      [pullBack, 0],
      [realWork, portrait ? 6 : -12, ease.scene],
      [dive, portrait ? 4 : -6],
      [arrive, 0, ease.inOut],
    ]),
    rz: keys(f, [
      [pullBack, 0],
      [realWork, portrait ? -2 : 1.5, ease.scene],
      [arrive, 0, ease.inOut],
    ]),
  }
  const roam = tw(f, pullBack, realWork) * (1 - tw(f, dive, arrive))
  cam.x += drift(f, 31, 20) * roam
  cam.y += drift(f, 32, 14) * roam

  const dim = 1 - 0.5 * tw(f, realWork - 4, realWork + 4) * (1 - tw(f, dive, dive + 10))
  // The words hang between the camera and the wall, square to the lens; the move passes them.
  const typeZ = far - 1400
  const dist = cam.z + 1613 - typeZ
  const typeScale = dist > 0 ? 1613 / dist : 0
  const typeO = Math.min(1, Math.max(0, (dist - 260) / 500))
  const typeBlur = Math.max(0, typeScale - 1.6) * 6

  return (
    <AbsoluteFill style={{ background: brand.black }}>
      <KeyLight x={38} y={30} size={80} strength={0.08} />
      <Stage cam={cam}>
        {tiles.map((t, i) => {
          const ring = Math.max(Math.abs(t.col), Math.abs(t.row))
          const o = t.kind === 'product' ? 1 : tw(f, pullBack + ring * 2, pullBack + 6 + ring * 3)
          if (o <= 0) return null
          const special = t.kind === 'product' || t.kind === 'defense' || t.kind === 'outcome'
          const lit = special ? 1 : 0.62 + 0.38 * Math.abs(Math.sin(i * 1.7))
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
                    f={f}
                    t={{
                      systemA: pullBack,
                      stateChange: realWork + 10,
                      systemB: arrive + 99,
                      structure: arrive + 99,
                      end: arrive + 99,
                    }}
                  />
                ) : t.kind === 'outcome' ? (
                  <ClutterFrame fmt={v.fmt} f={arrive} v={v} />
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
      {typeScale > 0 && typeO > 0 ? (
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: typeO }}>
          <div
            style={{
              transform: `scale(${typeScale})`,
              filter: typeBlur > 0.3 ? `blur(${typeBlur}px)` : undefined,
              textShadow: '0 20px 80px rgba(0,0,0,0.6)',
            }}
          >
            <Campaign
              lines={portrait ? ['BUILT', 'FOR', 'REAL', 'WORK.'] : copy.realWork}
              f={f}
              at={realWork - 4}
              size={portrait ? 411 : 355}
            />
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
