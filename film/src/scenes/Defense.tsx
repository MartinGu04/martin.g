/**
 * 05 DEFENSE SYSTEMS (confidential work: sanitized aliases and generated geometry only).
 * System A: a topology alive with signals; one node changes state, and the system answers
 * by rerouting. System B: a raw row of masked blocks enters and, in three snaps, becomes a
 * structured, finished document. Its grid then comes towards the camera and opens into the
 * design world. No interface, text, data or styling from the real systems.
 */
import { AbsoluteFill } from 'remotion'
import { world } from '../config/palette'
import { s, type Format } from '../config/timeline'
import { Plane, Stage } from '../lib/camera'
import { clamp, drift, ease, keys, mix, rng, tw } from '../lib/anim'
import { TopologyView, topology } from '../components/Geometry'
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
