import type { ConfidentialProject } from '@/content/schema'
import styles from './SystemDiagram.module.css'

type Pattern = ConfidentialProject['cover']['pattern']

const W = 640
const H = 280

/** Small deterministic generator, so the geometry is identical on every render. */
function random(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const r1 = (n: number) => Math.round(n * 10) / 10

interface Geometry {
  paths: string[]
  pulses: string[]
  nodes: { x: number; y: number; kind: 'hollow' | 'solid' | 'accent' }[]
  masks: { x: number; y: number; w: number; h: number }[]
}

/** A topology: nodes on a loose lattice joined by orthogonal pathways. */
function topology(): Geometry {
  const rnd = random(11)
  const cols = 9
  const rows = 4
  const pts: { x: number; y: number }[][] = []
  for (let r = 0; r < rows; r++) {
    pts.push([])
    for (let c = 0; c < cols; c++) {
      pts[r]!.push({
        x: r1(40 + c * 70 + (rnd() - 0.5) * 22),
        y: r1(42 + r * 64 + (rnd() - 0.5) * 16),
      })
    }
  }
  const paths: string[] = []
  const nodes: Geometry['nodes'] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const p = pts[r]![c]!
      const right = pts[r]![c + 1]
      const down = pts[r + 1]?.[c]
      if (right && rnd() > 0.28)
        paths.push(`M${p.x} ${p.y}H${r1((p.x + right.x) / 2)}V${right.y}H${right.x}`)
      if (down && rnd() > 0.62)
        paths.push(`M${p.x} ${p.y}V${r1((p.y + down.y) / 2)}H${down.x}V${down.y}`)
      const k = rnd()
      nodes.push({ ...p, kind: k > 0.93 ? 'accent' : k > 0.6 ? 'hollow' : 'solid' })
    }
  }
  const pulses = paths.filter((_, i) => i % 5 === 2).slice(0, 4)
  const masks = [
    { x: 236, y: 96, w: 118, h: 44 },
    { x: 452, y: 168, w: 92, h: 34 },
    { x: 82, y: 200, w: 70, h: 26 },
  ]
  return { paths, pulses, nodes, masks }
}

/** Data pathways: lanes that step between levels, joined by a few vertical links. */
function pathways(): Geometry {
  const rnd = random(23)
  const lanes = 6
  const paths: string[] = []
  const nodes: Geometry['nodes'] = []
  const steps: number[][] = []
  for (let l = 0; l < lanes; l++) {
    const base = 34 + l * 42
    let y = base
    let d = `M20 ${y}`
    const xs: number[] = []
    for (let x = 20; x < W - 20;) {
      const run = 40 + Math.floor(rnd() * 80)
      x = Math.min(W - 20, x + run)
      d += `H${x}`
      xs.push(x)
      if (x < W - 20 && rnd() > 0.45) {
        y = r1(base + (rnd() - 0.5) * 22)
        d += `V${y}`
        if (rnd() > 0.55) nodes.push({ x, y, kind: rnd() > 0.85 ? 'accent' : 'hollow' })
      }
    }
    paths.push(d)
    steps.push(xs)
  }
  for (let i = 0; i < 7; i++) {
    const x = r1(60 + rnd() * (W - 120))
    const a = Math.floor(rnd() * (lanes - 1))
    paths.push(`M${x} ${34 + a * 42}V${34 + (a + 1 + Math.floor(rnd() * 2)) * 42}`)
    nodes.push({ x, y: 34 + a * 42, kind: 'solid' })
  }
  const pulses = [paths[1]!, paths[3]!, paths[4]!]
  const masks = [
    { x: 300, y: 52, w: 132, h: 38 },
    { x: 96, y: 150, w: 84, h: 30 },
    { x: 486, y: 196, w: 104, h: 32 },
  ]
  return { paths, pulses, nodes, masks }
}

const GEOMETRY: Record<Pattern, () => Geometry> = {
  grid: topology,
  lines: pathways,
  field: topology,
}

/**
 * A generated, non-representational system diagram for confidential work: topology or
 * data pathways, a few masked structural blocks, and, while the scene is visible, a slow
 * scan and pulses travelling along some paths. It depicts no real system, carries no text,
 * labels, coordinates or data, and is hidden from assistive technology. `still` draws the
 * geometry alone (no scan, no pulses), for small previews outside an ambient scene.
 */
export function SystemDiagram({ pattern, still }: { pattern: Pattern; still?: boolean }) {
  const g = GEOMETRY[pattern]()
  return (
    <svg
      className={styles.diagram}
      data-pattern={pattern}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <g className={styles.paths}>
        {g.paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      {still ? null : (
        <g className={styles.pulses}>
          {g.pulses.map((d, i) => (
            <path
              key={i}
              d={d}
              pathLength={100}
              data-loop=""
              style={{ animationDelay: `${i * -1.7}s` }}
            />
          ))}
        </g>
      )}
      <g className={styles.nodes}>
        {g.nodes.map((n, i) =>
          n.kind === 'hollow' ? (
            <rect
              key={i}
              x={n.x - 3.5}
              y={n.y - 3.5}
              width={7}
              height={7}
              className={styles.hollow}
            />
          ) : (
            <rect
              key={i}
              x={n.x - 2}
              y={n.y - 2}
              width={4}
              height={4}
              className={n.kind === 'accent' ? styles.accent : styles.solid}
            />
          ),
        )}
      </g>
      <g className={styles.masks}>
        {g.masks.map((m, i) => (
          <rect key={i} x={m.x} y={m.y} width={m.w} height={m.h} />
        ))}
      </g>
      {still ? null : (
        <>
          <defs>
            <linearGradient id={`scan-${pattern}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="currentColor" stopOpacity="0" />
              <stop offset="0.75" stopColor="currentColor" stopOpacity="0.1" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0.28" />
            </linearGradient>
          </defs>
          <rect
            className={styles.scan}
            x={0}
            y={0}
            width={72}
            height={H}
            fill={`url(#scan-${pattern})`}
            data-loop=""
          />
        </>
      )}
    </svg>
  )
}
