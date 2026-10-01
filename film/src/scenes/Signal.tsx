/**
 * 01 SIGNAL. Black; one sharp pulse; a microscopic point. The camera rushes to it through
 * planes of the grid, arrives in macro on the symbol, and pulls back while engineered
 * construction lines find the mark's geometry and light uncovers it. A beat of silence,
 * then the impact: the symbol is complete. The camera then pushes through the counter of
 * the G into the next world.
 *
 * Portrait starts mid-rush: on a phone the first frame already moves.
 */
import { AbsoluteFill } from 'remotion'
import { brand } from '../config/palette'
import { s } from '../config/timeline'
import { Plane, Stage } from '../lib/camera'
import { clamp, ease, jolt, keys, tw, drift } from '../lib/anim'
import { BrandSymbol, symbolAspect } from '../components/Mark'
import { KeyLight } from '../components/Atmosphere'
import type { SceneProps } from './types'

/** Construction geometry in the symbol's own pixel space (968 × 599). */
const MW = 968
const MH = 599
const NODE = { x: 640, y: 289 }
type Seg = { d: string; len: number; at: number; main?: boolean }
const seg = (x1: number, y1: number, x2: number, y2: number, at: number, main = false): Seg => ({
  d: `M${x1} ${y1} L${x2} ${y2}`,
  len: Math.hypot(x2 - x1, y2 - y1),
  at,
  main,
})
const LINES: Seg[] = [
  seg(NODE.x, NODE.y, 3400, NODE.y, 0, true), // the G crossbar, carried out as the thread
  seg(NODE.x, NODE.y, -2400, NODE.y, 0.02, true),
  seg(126, 300, 126, -1800, 0.12), // the N stem
  seg(126, 300, 126, 2400, 0.12),
  seg(-2400, 594, 3400, 594, 0.24), // baseline
  seg(-1100, -1165, 1700, 1635, 0.32), // the diagonal
  { d: 'M 655 -2 A 300 300 0 1 0 655 598 A 300 300 0 1 0 655 -2', len: 1885, at: 0.42 }, // the bowl
  seg(878, 289, 878, 2400, 0.55), // the G stem
  seg(-2400, 4, 3400, 4, 0.62), // cap line
]

function GridPlane({ z, w, h, o }: { z: number; w: number; h: number; o: number }) {
  const cols = 12
  const rows = 7
  return (
    <Plane z={z} w={w} h={h} opacity={o} sharp>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
        {Array.from({ length: cols + 1 }, (_, i) => (
          <line
            key={`c${i}`}
            x1={(i * w) / cols}
            y1={0}
            x2={(i * w) / cols}
            y2={h}
            stroke={brand.light}
            strokeOpacity={0.16}
            strokeWidth={2}
          />
        ))}
        {Array.from({ length: rows + 1 }, (_, i) => (
          <line
            key={`r${i}`}
            x1={0}
            y1={(i * h) / rows}
            x2={w}
            y2={(i * h) / rows}
            stroke={brand.light}
            strokeOpacity={0.08}
            strokeWidth={2}
          />
        ))}
        {[
          [0, 0],
          [w, 0],
          [0, h],
          [w, h],
          [w / 2, h / 2],
        ].map(([x, y], i) => (
          <path
            key={i}
            d={`M${x! - 40} ${y} H${x! + 40} M${x} ${y! - 40} V${y! + 40}`}
            stroke={brand.light}
            strokeOpacity={0.55}
            strokeWidth={3}
          />
        ))}
      </svg>
    </Plane>
  )
}

export function Signal({ v, f }: SceneProps) {
  const c = v.cues
  const portrait = v.fmt === 'portrait'
  const S = portrait ? 940 : 1100 // symbol width on its plane
  const SH = S / symbolAspect
  const k = S / MW
  const node = { x: (NODE.x - MW / 2) * k, y: (NODE.y - MH / 2) * k }
  const counter = { x: (712 - MW / 2) * k, y: (420 - MH / 2) * k }

  const pulse = s(c.pulse)
  const arrive = s(c.arrive)
  const hush = s(c.hush)
  const impact = s(c.impact)
  const push = s(c.push)
  const startZ = portrait ? 5200 : 9000

  // Camera choreography.
  const z = keys(f, [
    [0, portrait ? startZ : startZ],
    [pulse, startZ],
    [arrive, -1180, portrait ? ease.out : ease.arrive],
    [hush, portrait ? 120 : 260, ease.inOut],
    [impact, portrait ? 150 : 290, ease.linear],
    [push, portrait ? 60 : 190, ease.out],
    [push + s(0.75), -1700, ease.in],
  ])
  const x = keys(f, [
    [arrive, node.x],
    [hush, 0, ease.inOut],
    [push, 0],
    [push + s(0.75), counter.x, ease.in],
  ])
  const y = keys(f, [
    [arrive, node.y],
    [hush, portrait ? -40 : 0, ease.inOut],
    [push, portrait ? -40 : 0],
    [push + s(0.75), counter.y, ease.in],
  ])
  const ry = keys(f, [
    [0, portrait ? 10 : 0],
    [arrive, portrait ? -8 : -14, ease.out],
    [impact, -2, ease.inOut],
    [push, 0],
  ])
  const rx = keys(f, [
    [pulse + 6, 0],
    [arrive, 7, ease.out],
    [impact, 1, ease.inOut],
  ])
  const rz = keys(f, [
    [0, portrait ? 14 : 0],
    [arrive, portrait ? -3 : 2, ease.out],
    [impact, 0, ease.inOut],
  ])
  const cam = {
    x: x + drift(f, 1, 3),
    y: y + drift(f, 2, 2),
    z: z + jolt(f, impact, 26),
    rx,
    ry,
    rz,
    dof: f < arrive ? 0 : 2.2 * (1 - tw(f, impact, impact + 6)),
    focusZ: 0,
  }

  // Construction lines draw from the node after arrival; they flash at the impact, then go.
  const drawT = (f - s(c.build)) / (hush - s(c.build))
  const flash = Math.exp(-Math.max(0, f - impact) / 3) * (f >= impact ? 1 : 0)
  const linesOut = 1 - tw(f, impact + 2, impact + 16, ease.inOut)
  const lineAlpha = (0.42 + flash * 0.5) * linesOut

  // The mark: uncovered by light from the node while lines draw, complete on the impact.
  const reveal = clamp(drawT * 1.15)
  const lightR = 80 + reveal * 1300
  const markOpacity = f >= impact ? 1 : 0.55 + 0.3 * ease.inOut(reveal)
  // The light travels from the node across the bowl to the stem of the N.
  const lx = (NODE.x - reveal * 380) * k
  const ly = (NODE.y + Math.sin(reveal * Math.PI) * 60) * k
  const mask =
    f >= impact
      ? undefined
      : `radial-gradient(circle ${lightR * k}px at ${lx}px ${ly}px, #000 0%, rgba(0,0,0,0.55) 35%, rgba(0,0,0,0.08) 80%, rgba(0,0,0,0) 100%)`

  // The signal: a node of constant size on screen, seen from far away.
  const nodeVisible = f >= pulse && f < impact
  const pulseFlash = f >= pulse ? Math.exp(-(f - pulse) / 4) : 0
  const eyeDist = cam.z + 1613 - 0
  const nodeScale = Math.max(1, eyeDist / 1613)
  const strokeW = 1.6 * Math.max(0.3, eyeDist / 1613)

  // Before arrival, only the node and the grid planes exist.
  const planes = portrait ? [600, 1700, 2900, 4300] : [700, 2100, 3700, 5400, 7200]

  return (
    <AbsoluteFill style={{ background: brand.black }}>
      <KeyLight
        x={50}
        y={portrait ? 42 : 40}
        size={portrait ? 90 : 60}
        strength={0.06 * tw(f, arrive, impact) + 0.05 * flash}
      />
      <Stage cam={cam}>
        {planes.map((pz, i) => (
          <GridPlane
            key={i}
            z={pz}
            w={portrait ? 3400 : 5200}
            h={portrait ? 5200 : 3000}
            o={tw(f, pulse + i * 2, pulse + 10 + i * 2) * (1 - tw(f, arrive, arrive + 6))}
          />
        ))}
        <Plane w={S} h={SH} z={0}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: markOpacity,
              WebkitMaskImage: mask,
              maskImage: mask,
              WebkitMaskSize: '100% 100%',
            }}
          >
            <BrandSymbol width={S} />
          </div>
        </Plane>
        <Plane w={S} h={SH} z={1} sharp>
          <svg
            width={S}
            height={SH}
            viewBox={`0 0 ${MW} ${MH}`}
            style={{ overflow: 'visible', position: 'absolute', inset: 0 }}
          >
            {LINES.map((l, i) => {
              const p = ease.out(clamp((drawT - l.at) / 0.45))
              if (p <= 0 || lineAlpha <= 0) return null
              return (
                <path
                  key={i}
                  d={l.d}
                  fill="none"
                  stroke={brand.light}
                  strokeOpacity={lineAlpha * (l.main ? 1 : 0.7)}
                  strokeWidth={strokeW / k}
                  strokeDasharray={`${l.len} ${l.len * 4}`}
                  strokeDashoffset={l.len * (1 - p)}
                />
              )
            })}
          </svg>
        </Plane>
        {nodeVisible ? (
          <Plane x={node.x} y={node.y} z={2} w={8} h={8} scale={nodeScale} sharp>
            <div
              style={{
                width: 8,
                height: 8,
                background: brand.light,
                boxShadow: `0 0 ${12 + pulseFlash * 30}px rgba(255,244,230,${0.35 + pulseFlash * 0.6})`,
              }}
            />
          </Plane>
        ) : null}
      </Stage>
      {/* The pulse: one frame of a hairline across the whole frame, decaying into a thread. */}
      {f >= pulse && f < arrive + 4 ? (
        <div
          style={{
            position: 'absolute',
            insetInlineStart: 0,
            insetInlineEnd: 0,
            insetBlockStart: '50%',
            height: 1.5,
            background: `linear-gradient(90deg, rgba(255,244,230,0), rgba(255,244,230,${0.9 * pulseFlash + 0.06}) 50%, rgba(255,244,230,0))`,
            opacity: 1 - tw(f, arrive - 6, arrive + 4),
          }}
        />
      ) : null}
    </AbsoluteFill>
  )
}
