/**
 * 05 DEFENSE SYSTEMS (confidential work: sanitized aliases and generated geometry only).
 * System A: a topology alive with signals; one node changes state, and the system answers
 * by rerouting. System B: a raw row of masked blocks enters and, in three snaps, becomes a
 * structured, finished document. Its grid then comes towards the camera and opens into the
 * design world. No interface, text, data or styling from the real systems.
 */
import { AbsoluteFill } from 'remotion'
import { copy } from '../config/copy'
import { world } from '../config/palette'
import { s, type Format } from '../config/timeline'
import { Plane, Stage } from '../lib/camera'
import { clamp, drift, ease, keys, mix, rng, tw } from '../lib/anim'
import { TopologyView, topology } from '../components/Geometry'
import { Slate } from '../components/Slate'
import type { SceneProps } from './types'

const d = world.defense

const TOPO = {
  landscape: [topology(1920, 1080, 11, 6, 11), topology(2400, 1400, 9, 5, 23)],
  portrait: [topology(1080, 1920, 5, 10, 11), topology(1400, 2400, 5, 8, 23)],
}

/** The raw row: masked blocks of different widths, in the order they arrived. */
const BLOCKS = (() => {
  const r = rng(5)
  return Array.from({ length: 18 }, (_, i) => ({ w: 40 + Math.round(r() * 120), tone: r(), i }))
})()

export interface DefenseTimes {
  systemA: number
  stateChange: number
  systemB: number
  structure: number
  end: number
}

/** System A in its own 1920 × 1080 (or 1080 × 1920) space. */
export function SystemA({ fmt, f, t }: { fmt: Format; f: number; t: DefenseTimes }) {
  const portrait = fmt === 'portrait'
  const W = portrait ? 1080 : 1920
  const H = portrait ? 1920 : 1080
  const [a] = TOPO[fmt]
  const change = tw(f, t.stateChange, t.stateChange + 14, ease.out)
  const n = a!.nodes[Math.floor(a!.nodes.length * 0.45)]!
  const scan = ((f - t.systemA) / 72) % 1
  return (
    <div
      style={{ position: 'relative', width: W, height: H, background: d.bg, overflow: 'hidden' }}
    >
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        {Array.from({ length: portrait ? 5 : 13 }, (_, i) => (
          <line
            key={i}
            x1={(i * W) / (portrait ? 4 : 12)}
            y1={0}
            x2={(i * W) / (portrait ? 4 : 12)}
            y2={H}
            stroke={d.text}
            strokeOpacity={0.05}
          />
        ))}
      </svg>
      <div style={{ position: 'absolute', inset: 0 }}>
        <TopologyView
          topo={a!}
          w={W}
          h={H}
          draw={1}
          t={(f - t.systemA) / 24}
          accentAt={Math.floor(a!.nodes.length * 0.45)}
        />
      </div>
      {/* the state change: a ring opens from the node */}
      {f >= t.stateChange ? (
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <rect
            x={n.x - 9 - change * 60}
            y={n.y - 9 - change * 60}
            width={18 + change * 120}
            height={18 + change * 120}
            fill="none"
            stroke={d.accent}
            strokeOpacity={0.9 * (1 - change)}
            strokeWidth={2}
          />
          <rect
            x={n.x - 16}
            y={n.y - 16}
            width={32}
            height={32}
            fill="none"
            stroke={d.accent}
            strokeOpacity={0.8}
            strokeWidth={1.5}
          />
        </svg>
      ) : null}
      {/* a slow scan */}
      <div
        style={{
          position: 'absolute',
          insetBlock: 0,
          insetInlineStart: `${scan * 100}%`,
          width: 2,
          background: `linear-gradient(180deg, rgba(127,180,204,0), rgba(127,180,204,0.35), rgba(127,180,204,0))`,
        }}
      />
    </div>
  )
}

export function Defense({ v, f }: SceneProps) {
  const c = v.cues
  const portrait = v.fmt === 'portrait'
  const W = portrait ? 1080 : 1920
  const H = portrait ? 1920 : 1080
  const t: DefenseTimes = {
    systemA: s(c.systemA),
    stateChange: s(c.stateChange),
    systemB: s(c.systemB),
    structure: s(c.structure),
    end: s(c.design),
  }
  const B = portrait ? { x: 0, y: 2600 } : { x: 2700, y: 0 } // System B sits beyond A, the camera travels to it

  const toB = tw(f, t.systemB - 10, t.systemB + 8, ease.inOut)
  const snap1 = tw(f, t.structure - 2, t.structure + 3, ease.snap)
  const snap2 = tw(f, t.structure + 4, t.structure + 9, ease.snap)
  const snap3 = tw(f, t.structure + 10, t.structure + 15, ease.snap)

  const cam = {
    x: mix(0, B.x, toB) + drift(f, 21, 6),
    y: mix(0, B.y, toB) + drift(f, 22, 4),
    z: keys(f, [
      [t.systemA, 0],
      [t.stateChange, -90, ease.inOut],
      [t.systemB - 10, -60],
      [t.systemB, 260, ease.inOut],
      [t.structure + 15, 120, ease.inOut],
      [t.end, -900, ease.rush],
    ]),
    ry: keys(f, [
      [t.systemA, 0],
      [t.stateChange, portrait ? 4 : 10, ease.inOut],
      [t.systemB - 6, portrait ? 0 : 18, ease.inOut],
      [t.systemB + 8, 0, ease.inOut],
    ]),
    rx: keys(f, [
      [t.systemA, 0],
      [t.stateChange, portrait ? 8 : 5, ease.inOut],
      [t.systemB + 8, 0, ease.inOut],
    ]),
    dof: 2.5,
    focusZ: 0,
  }

  // System B: the row (raw), then columns, then a page.
  const rowW = BLOCKS.reduce((a, b) => a + b.w + 10, 0)
  const page = portrait ? { w: 760, h: 1040 } : { w: 880, h: 1000 }
  const enterRow = tw(f, t.systemB - 4, t.structure, ease.out)
  return (
    <AbsoluteFill style={{ background: d.bg }}>
      <Stage cam={cam}>
        <Plane w={W} h={H}>
          <SystemA fmt={v.fmt} f={f} t={t} />
        </Plane>
        {/* a deeper second layer of the topology, for parallax */}
        <Plane z={-600} w={W * 1.4} h={H * 1.4} opacity={0.35}>
          <TopologyView
            topo={TOPO[v.fmt][1]!}
            w={W * 1.4}
            h={H * 1.4}
            t={(f - t.systemA) / 30}
            stroke={2}
            node={12}
          />
        </Plane>
        {/* the bridge: one path carries the camera from A to B */}
        <Plane x={B.x / 2} y={B.y / 2} w={portrait ? 4 : B.x} h={portrait ? B.y : 4} sharp>
          <div
            style={{
              width: '100%',
              height: '100%',
              background: d.accent,
              opacity: 0.5 * tw(f, t.systemB - 14, t.systemB - 4),
              transformOrigin: portrait ? 'top' : 'left',
              transform: portrait
                ? `scaleY(${tw(f, t.systemB - 14, t.systemB, ease.inOut)})`
                : `scaleX(${tw(f, t.systemB - 14, t.systemB, ease.inOut)})`,
            }}
          />
        </Plane>
        <Plane x={B.x} y={B.y} w={W} h={H}>
          <div
            style={{
              position: 'relative',
              width: W,
              height: H,
              background: d.bg,
              overflow: 'hidden',
            }}
          >
            {/* the page frame, drawn by the second snap */}
            <div
              style={{
                position: 'absolute',
                insetInlineStart: (W - page.w) / 2,
                insetBlockStart: (H - page.h) / 2,
                width: page.w,
                height: page.h,
                border: `1.5px solid rgba(236,239,242,${0.5 * snap2})`,
                background: `rgba(28,32,38,${snap2})`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  insetInline: 48,
                  insetBlockStart: 48,
                  height: 22,
                  background: d.text,
                  opacity: 0.85 * snap3,
                  transformOrigin: 'right',
                  transform: `scaleX(${snap3})`,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  insetInlineStart: 48,
                  insetBlockStart: 92,
                  width: 220,
                  height: 12,
                  background: d.muted,
                  opacity: 0.6 * snap3,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  insetInlineEnd: 48,
                  insetBlockStart: 48,
                  width: 18,
                  height: 18,
                  background: d.accent,
                  opacity: snap3,
                  transform: `scale(${snap3})`,
                }}
              />
            </div>
            {BLOCKS.map((b, i) => {
              // raw: one long row; snap1: grouped into three columns; snap2/3: rows of the page
              let x0 = -rowW / 2
              for (let j = 0; j < i; j++) x0 += BLOCKS[j]!.w + 10
              const rawX = W / 2 + x0 + mix(-W, 0, enterRow)
              const rawY = H / 2
              const col = i % 3
              const colX = W / 2 + (col - 1) * (portrait ? 230 : 280) - b.w / 2
              const colY = H / 2 - 160 + Math.floor(i / 3) * 52
              const line = Math.floor(i / 2)
              const pageX = (W - page.w) / 2 + 48 + (i % 2) * (page.w / 2 - 24)
              const pageY = (H - page.h) / 2 + 150 + line * ((page.h - 220) / 9)
              const pw =
                (i % 2 ? page.w / 2 - 72 : page.w / 2 - 48) * (0.55 + 0.45 * ((b.tone * 7) % 1))
              const x = mix(mix(rawX, colX, snap1), pageX, snap2)
              const y = mix(mix(rawY, colY, snap1), pageY, snap2)
              const w = mix(b.w, pw, snap2)
              const h = mix(34, 14, snap2)
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    insetInlineStart: x,
                    insetBlockStart: y - h / 2,
                    width: w,
                    height: h,
                    background: i === 7 ? d.accent : d.text,
                    opacity: i === 7 ? 0.9 : mix(0.22 + b.tone * 0.35, 0.42, snap3),
                  }}
                />
              )
            })}
          </div>
        </Plane>
      </Stage>
      <Slate
        fmt={v.fmt}
        f={f}
        at={t.systemA + 4}
        until={t.systemB + 20}
        index={copy.slates.defense[0]}
        name={copy.slates.defense[1]}
        tone={d.text}
      />
    </AbsoluteFill>
  )
}
