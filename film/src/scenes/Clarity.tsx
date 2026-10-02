/**
 * 02 COMPLEXITY → CLARITY. Through the counter of the G, a dense field: interface pieces,
 * rows, code, nodes, status, time. Then, on the eighths, it resolves: everything turns to
 * face us, snaps to the grid, what is not needed falls away, and the pieces that remain
 * assemble into the real interface they were cut from. PROBLEM becomes PRODUCT on the
 * downbeat. The camera then pushes into the product's main card.
 */
import { AbsoluteFill } from 'remotion'
import { assets, type Source } from '../config/assets'
import { copy } from '../config/copy'
import { brand, world } from '../config/palette'
import { s } from '../config/timeline'
import { Plane, Stage } from '../lib/camera'
import { clamp, drift, ease, keys, mix, rng, tw } from '../lib/anim'
import { Crop } from '../components/media'
import { Bars, CODE, CodeBlock, DataRow, Nodes, Pill, ROWS } from '../components/Fragments'
import { display, MaskLine } from '../components/Type'
import type { SceneProps } from './types'

type Region = readonly [number, number, number, number]
interface Frag {
  kind: 'crop' | 'code' | 'row' | 'nodes' | 'bars' | 'pill'
  w: number
  h: number
  x0: number
  y0: number
  z0: number
  rx0: number
  ry0: number
  rz0: number
  /** Where it belongs in the product; undefined: it falls away. */
  t?: { x: number; y: number }
  src?: Source
  region?: Region
  i: number
}

/** The pieces of the destination interface, in its own pixels. */
const DEST = {
  landscape: {
    src: assets.mm.focus,
    width: 1300,
    y: 10,
    parts: [
      [830, 14, 250, 92],
      [612, 121, 226, 101],
      [848, 121, 226, 101],
      [880, 236, 180, 22],
      [16, 276, 1058, 130],
      [16, 406, 1058, 156],
    ] as Region[],
    card: [16, 276, 1058, 286] as Region,
  },
  portrait: {
    src: assets.mm.mobile,
    width: 760,
    y: 40,
    parts: [
      [36, 80, 357, 50],
      [190, 160, 210, 85],
      [38, 260, 352, 100],
      [38, 368, 352, 100],
      [38, 520, 352, 140],
      [38, 660, 352, 135],
      [36, 792, 357, 52],
    ] as Region[],
    card: [38, 520, 352, 275] as Region,
  },
}

/** Other real pieces that belong to the problem, not to this screen. */
const NOISE: { src: Source; r: Region }[] = [
  { src: assets.mm.week, r: [1270, 82, 116, 26] },
  { src: assets.mm.week, r: [1142, 82, 116, 26] },
  { src: assets.mm.week, r: [1014, 82, 116, 26] },
  { src: assets.mm.week, r: [628, 145, 116, 26] },
  { src: assets.mm.week, r: [758, 145, 116, 26] },
  { src: assets.mm.week, r: [1014, 208, 116, 26] },
  { src: assets.mm.week, r: [490, 271, 126, 26] },
  { src: assets.mm.week, r: [1388, 320, 54, 80] },
  { src: assets.mm.week, r: [640, 0, 760, 70] },
  { src: assets.mm.admin, r: [0, 170, 480, 120] },
  { src: assets.mm.admin, r: [1000, 50, 470, 80] },
  { src: assets.mm.manager, r: [1300, 20, 170, 60] },
  { src: assets.mm.dashboard, r: [1390, 50, 511, 380] },
]

function buildFragments(portrait: boolean): Frag[] {
  const rnd = rng(portrait ? 92 : 41)
  const d = portrait ? DEST.portrait : DEST.landscape
  const k = d.width / d.src.w
  const dh = d.src.h * k
  const spreadX = portrait ? 620 : 1350
  const spreadY = portrait ? 1150 : 720
  const scatter = () => ({
    x0: (rnd() * 2 - 1) * spreadX,
    y0: (rnd() * 2 - 1) * spreadY,
    z0: -1700 + rnd() * 2100,
    rx0: (rnd() * 2 - 1) * 24,
    ry0: (rnd() * 2 - 1) * 38,
    rz0: (rnd() * 2 - 1) * 16,
  })
  const out: Frag[] = []
  d.parts.forEach((r) => {
    out.push({
      kind: 'crop',
      src: d.src,
      region: r,
      w: r[2] * k,
      h: r[3] * k,
      t: { x: (r[0] + r[2] / 2) * k - d.width / 2, y: (r[1] + r[3] / 2) * k - dh / 2 + d.y },
      ...scatter(),
      i: out.length,
    })
  })
  const noiseScale = portrait ? 1.6 : 1.5
  NOISE.forEach((n) =>
    out.push({
      kind: 'crop',
      src: n.src,
      region: n.r,
      w: n.r[2] * noiseScale,
      h: n.r[3] * noiseScale,
      ...scatter(),
      i: out.length,
    }),
  )
  CODE.forEach(() => out.push({ kind: 'code', w: 520, h: 120, ...scatter(), i: out.length }))
  ROWS.forEach(() => out.push({ kind: 'row', w: 420, h: 44, ...scatter(), i: out.length }))
  for (let j = 0; j < (portrait ? 3 : 5); j++)
    out.push({ kind: 'nodes', w: 300, h: 160, ...scatter(), i: out.length })
  for (let j = 0; j < 3; j++) out.push({ kind: 'bars', w: 360, h: 64, ...scatter(), i: out.length })
  for (let j = 0; j < 4; j++) out.push({ kind: 'pill', w: 180, h: 40, ...scatter(), i: out.length })
  return out
}

const FRAGS = { landscape: buildFragments(false), portrait: buildFragments(true) }

function FragBody({ fr }: { fr: Frag }) {
  switch (fr.kind) {
    case 'crop':
      return (
        <Crop
          src={fr.src!}
          region={fr.region}
          width={fr.w}
          style={{ boxShadow: '0 30px 60px rgba(0,0,0,0.45)' }}
        />
      )
    case 'code':
      return <CodeBlock lines={CODE[fr.i % CODE.length]!} size={18} />
    case 'row':
      return <DataRow cells={ROWS[fr.i % ROWS.length]!} size={19} />
    case 'nodes':
      return <Nodes w={fr.w} h={fr.h} seed={fr.i} />
    case 'bars':
      return <Bars w={fr.w} seed={fr.i % 5} />
    case 'pill':
      return (
        <Pill
          text={['07:30', '+2', '12 / 12', 'SYNC'][fr.i % 4]!}
          tone={fr.i % 2 ? world.miMaMo.green : world.miMaMo.amber}
        />
      )
  }
}

export function Clarity({ v, f }: SceneProps) {
  const c = v.cues
  const portrait = v.fmt === 'portrait'
  const d = portrait ? DEST.portrait : DEST.landscape
  const k = d.width / d.src.w
  const dh = d.src.h * k
  const frags = FRAGS[v.fmt]

  const push = s(c.push)
  const problem = s(c.problem)
  const snap = s(c.snap)
  const lock = s(c.lock)
  const step = (lock - snap) / 4
  const enter = s(c.enterCard)
  const macro = s(c.macro)

  // The four snaps, each landing on an eighth.
  const p1 = tw(f, snap - 2, snap + 3, ease.snap)
  const p2 = tw(f, snap + step - 2, snap + step + 3, ease.snap)
  const p3 = tw(f, snap + 2 * step - 2, snap + 2 * step + 4, ease.snap)
  const p4 = tw(f, snap + 3 * step - 2, snap + 3 * step + 4, ease.snap)
  const locked = tw(f, lock - 1, lock + 3, ease.snap)

  // Camera: carries the push through the symbol, drifts in the field, squares up on the
  // snap, then pushes into the main card.
  const card = d.card
  const cardX = (card[0] + card[2] / 2) * k - d.width / 2
  const cardY = (card[1] + card[3] / 2) * k - dh / 2 + d.y
  const fill = portrait ? 1000 / (card[2] * k) : 1880 / (card[2] * k)
  const camFill = 1613 / fill - 1613
  const z = keys(f, [
    [push, 4200],
    [s(c.groove), 1100, ease.out],
    [snap, 620, ease.inOut],
    [snap + 3 * step, portrait ? 160 : 60, ease.inOut],
    [enter, portrait ? 60 : -60, ease.inOut],
    [macro, camFill, ease.rush],
  ])
  const cx = keys(f, [
    [push, 0],
    [snap, portrait ? 30 : -80],
    [snap + 3 * step, 0, ease.inOut],
    [enter, 0],
    [macro, cardX, ease.rush],
  ])
  const cy = keys(f, [
    [push, 0],
    [snap, 20],
    [snap + 3 * step, portrait ? 40 : 0, ease.inOut],
    [enter, 0],
    [macro, cardY, ease.rush],
  ])
  const chaos = 1 - p1
  const cam = {
    x: cx + drift(f, 3, 14) * chaos,
    y: cy + drift(f, 5, 10) * chaos,
    z,
    ry: keys(f, [
      [push, portrait ? 6 : 12],
      [snap, portrait ? -6 : -9],
      [snap + 2 * step, 0, ease.inOut],
    ]),
    rx: keys(f, [
      [push, -6],
      [snap, 4],
      [snap + 2 * step, 0, ease.inOut],
    ]),
    rz: keys(f, [
      [push, -4],
      [snap, 3],
      [snap + 2 * step, 0, ease.inOut],
    ]),
    dof: 4.5 * (1 - p2),
    focusZ: 0,
  }

  const bg = tw(f, push + 14, push + 22, ease.inOut)
  const world2 = tw(f, lock - 2, lock + 10, ease.inOut)

  // Type: PROBLEM rises letter by letter; on the lock BLEM leaves upward and DUCT arrives.
  const typeZ = portrait ? -380 : -520
  const typeSize = portrait ? 330 : 330
  // PRODUCT gets one clean beat before the interface takes the light.
  const dim = 1 - 0.82 * tw(f, lock + 10, lock + 24, ease.inOut)
  const ghost = 0.22 + 0.78 * tw(f, lock + 8, lock + 18, ease.inOut)
  const letters = (word: string, at: number, outAt?: number) =>
    [...word].map((ch, i) => {
      const a = at + i * 2
      const p = ease.mask(clamp((f - a) / 11))
      const o = outAt !== undefined ? ease.mask(clamp((f - outAt - i * 1.2) / 6)) : 0
      return (
        <MaskLine key={`${word}${i}${at}`} p={p} out={o}>
          <span style={{ display: 'inline-block' }}>{ch}</span>
        </MaskLine>
      )
    })
  const pre = copy.problem.slice(0, 3)
  const oldSuffix = copy.problem.slice(3)
  const newSuffix = copy.product.slice(3)
  const swapOut = lock - 7
  const swapIn = lock - 8
  const suffix = (
    <div style={{ position: 'relative', display: 'flex' }}>
      <div style={{ display: 'flex', visibility: f < swapIn ? 'visible' : 'visible' }}>
        {letters(oldSuffix, problem + 6, swapOut)}
      </div>
      <div
        style={{ display: 'flex', position: 'absolute', insetInlineStart: 0, insetBlockStart: 0 }}
      >
        {f >= swapIn
          ? newSuffix.split('').map((ch, i) => {
              const p = ease.mask(clamp((f - swapIn - i * 1.5) / 7))
              return (
                <MaskLine key={`n${i}`} p={p}>
                  <span style={{ display: 'inline-block' }}>{ch}</span>
                </MaskLine>
              )
            })
          : null}
      </div>
    </div>
  )

  return (
    <AbsoluteFill style={{ background: `rgba(6,6,6,${bg})` }}>
      <AbsoluteFill style={{ background: world.miMaMo.bg, opacity: world2 }} />
      <AbsoluteFill
        style={{
          opacity: world2 * 0.9,
          background: `radial-gradient(ellipse 70% 60% at ${portrait ? '50% 30%' : '62% 30%'}, rgba(127,166,214,0.16), rgba(127,166,214,0) 70%)`,
        }}
      />
      <Stage cam={cam}>
        {/* Depth type sits behind the work. */}
        <Plane
          z={typeZ}
          y={portrait ? -40 : 0}
          w={portrait ? 1200 : 2200}
          h={portrait ? 700 : 400}
          sharp
          opacity={dim}
        >
          <div
            style={{
              ...display,
              fontSize: typeSize,
              color: brand.ink,
              display: 'flex',
              flexDirection: portrait ? 'column' : 'row',
              alignItems: portrait ? 'flex-start' : 'center',
              justifyContent: 'center',
              height: '100%',
              paddingInlineStart: portrait ? 150 : 0,
            }}
          >
            <div style={{ display: 'flex' }}>{letters(pre, problem)}</div>
            {suffix}
          </div>
        </Plane>
        {/* The grid the pieces snap to. */}
        <Plane
          z={-2}
          y={d.y}
          w={d.width}
          h={dh}
          sharp
          opacity={tw(f, snap + step - 2, snap + step + 4) * (1 - tw(f, lock + 6, lock + 18))}
        >
          <svg width={d.width} height={dh} style={{ overflow: 'visible' }}>
            {Array.from({ length: (portrait ? 4 : 12) + 1 }, (_, i) => {
              const x = (i * d.width) / (portrait ? 4 : 12)
              return (
                <line
                  key={i}
                  x1={x}
                  y1={-400}
                  x2={x}
                  y2={dh + 400}
                  stroke={world.miMaMo.light}
                  strokeOpacity={0.35}
                  strokeWidth={1.2}
                />
              )
            })}
          </svg>
        </Plane>
        {/* The real interface, underneath the pieces, revealed by the lock. */}
        <Plane z={-1} y={d.y} w={d.width} h={dh} opacity={locked * ghost}>
          <div
            style={{
              clipPath: `inset(0 0 ${(1 - tw(f, lock - 1, lock + 6, ease.mask)) * 100}% 0)`,
            }}
          >
            <Crop src={d.src} width={d.width} />
          </div>
        </Plane>
        {frags.map((fr) => {
          const survivor = !!fr.t
          // stage 1: face the camera, gather into depth layers
          const zA = mix(fr.z0, Math.round(fr.z0 / 500) * 140, p1)
          // stage 2: quantize to the grid; stage 3: the extra falls away, the rest takes its place
          const colW = d.width / (portrait ? 4 : 12)
          const qx = Math.round(fr.x0 / colW) * colW
          const qy = Math.round(fr.y0 / 48) * 48
          let x = mix(mix(fr.x0, qx, p2), survivor ? fr.t!.x : qx, p3)
          let y = mix(mix(fr.y0, qy, p2), survivor ? fr.t!.y : qy, p3)
          let zz = mix(zA, 0, p2)
          let o = tw(f, push + 10 + (fr.i % 9), push + 22 + (fr.i % 9))
          if (!survivor) {
            zz = mix(zz, -1800, ease.in(p3))
            o *= 1 - p3
          } else {
            zz = mix(zz, 2, p3)
            o *=
              (1 - tw(f, lock + 2, lock + 8)) *
              (f >= lock - 6 ? 0.22 + 0.78 * (1 - tw(f, lock - 6, lock)) : 1)
          }
          if (o <= 0.01) return null
          const t = f * 0.4
          x += drift(t, fr.i, 18) * chaos
          y += drift(t, fr.i + 9, 12) * chaos
          return (
            <Plane
              key={fr.i}
              x={x}
              y={y}
              z={zz}
              rx={fr.rx0 * (1 - p1)}
              ry={fr.ry0 * (1 - p1)}
              rz={fr.rz0 * (1 - p1)}
              w={fr.w}
              h={fr.h}
              opacity={o}
            >
              <FragBody fr={fr} />
            </Plane>
          )
        })}
      </Stage>
    </AbsoluteFill>
  )
}
