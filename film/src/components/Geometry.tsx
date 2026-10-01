/**
 * Generated, non-representational system geometry for the confidential work (the film's
 * version of the site's SystemDiagram): nodes on a loose lattice joined by orthogonal
 * pathways, pulses travelling them, masked structural blocks. It depicts no real system and
 * carries no text, labels, coordinates or data.
 */
import { world } from '../config/palette'
import { clamp, rng } from '../lib/anim'

const d = world.defense

export interface Topology {
  nodes: { x: number; y: number; kind: 'hollow' | 'solid' | 'accent' }[]
  paths: { d: string; len: number }[]
  masks: { x: number; y: number; w: number; h: number }[]
}

export function topology(w: number, h: number, cols: number, rows: number, seed: number): Topology {
  const rnd = rng(seed)
  const pts: { x: number; y: number }[][] = []
  const mx = w / (cols + 1)
  const my = h / (rows + 1)
  for (let r = 0; r < rows; r++) {
    pts.push([])
    for (let c = 0; c < cols; c++)
      pts[r]!.push({
        x: mx * (c + 1) + (rnd() - 0.5) * mx * 0.35,
        y: my * (r + 1) + (rnd() - 0.5) * my * 0.3,
      })
  }
  const paths: Topology['paths'] = []
  const nodes: Topology['nodes'] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const p = pts[r]![c]!
      const right = pts[r]![c + 1]
      const down = pts[r + 1]?.[c]
      if (right && rnd() > 0.3) {
        const m = (p.x + right.x) / 2
        paths.push({
          d: `M${p.x} ${p.y}H${m}V${right.y}H${right.x}`,
          len: Math.abs(right.x - p.x) + Math.abs(right.y - p.y),
        })
      }
      if (down && rnd() > 0.6) {
        const m = (p.y + down.y) / 2
        paths.push({
          d: `M${p.x} ${p.y}V${m}H${down.x}V${down.y}`,
          len: Math.abs(down.x - p.x) + Math.abs(down.y - p.y),
        })
      }
      const k = rnd()
      nodes.push({ ...p, kind: k > 0.94 ? 'accent' : k > 0.6 ? 'hollow' : 'solid' })
    }
  }
  const masks = Array.from({ length: 4 }, () => ({
    x: rnd() * w * 0.8 + w * 0.05,
    y: rnd() * h * 0.8 + h * 0.05,
    w: 80 + rnd() * 140,
    h: 26 + rnd() * 20,
  }))
  return { nodes, paths, masks }
}

/** Draws a topology. `draw` 0 → 1 draws the paths in; `t` (seconds) moves the pulses. */
export function TopologyView({
  topo,
  w,
  h,
  draw = 1,
  t = 0,
  pulses = 6,
  stroke = 1.6,
  node = 9,
  opacity = 1,
  accentAt,
}: {
  topo: Topology
  w: number
  h: number
  draw?: number
  t?: number
  pulses?: number
  stroke?: number
  node?: number
  opacity?: number
  accentAt?: number
}) {
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible', opacity }}>
      {topo.masks.map((m, i) => (
        <rect
          key={`m${i}`}
          x={m.x}
          y={m.y}
          width={m.w * clamp(draw * 1.4 - 0.2)}
          height={m.h}
          fill={d.surface}
          stroke={d.line}
          strokeWidth={1}
        />
      ))}
      {topo.paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          fill="none"
          stroke={d.text}
          strokeOpacity={0.3}
          strokeWidth={stroke}
          strokeDasharray={`${p.len} ${p.len}`}
          strokeDashoffset={p.len * (1 - clamp(draw * 1.3 - (i % 7) * 0.04))}
        />
      ))}
      {topo.paths
        .filter((_, i) => i % Math.max(1, Math.floor(topo.paths.length / pulses)) === 1)
        .map((p, i) => {
          const seg = Math.min(60, p.len * 0.3)
          const phase = ((t * 0.55 + i * 0.37) % 1.3) / 1.3
          return (
            <path
              key={`p${i}`}
              d={p.d}
              fill="none"
              stroke={d.accent}
              strokeWidth={stroke * 1.8}
              strokeDasharray={`${seg} ${p.len * 3}`}
              strokeDashoffset={-phase * (p.len + seg) + seg}
              opacity={draw >= 1 ? 0.95 : 0}
            />
          )
        })}
      {topo.nodes.map((n, i) => {
        const a = n.kind === 'accent' || (accentAt !== undefined && i === accentAt)
        const s = node * clamp(draw * 1.5 - (i % 5) * 0.05)
        if (s <= 0) return null
        return (
          <rect
            key={`n${i}`}
            x={n.x - s / 2}
            y={n.y - s / 2}
            width={s}
            height={s}
            fill={a ? d.accent : n.kind === 'solid' ? d.text : d.bg}
            stroke={a ? d.accent : d.text}
            strokeOpacity={0.8}
            strokeWidth={1.4}
          />
        )
      })}
    </svg>
  )
}
