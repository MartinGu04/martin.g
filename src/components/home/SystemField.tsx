import styles from './SystemField.module.css'

const W = 1440
const H = 900

/** Small deterministic generator, so the field is identical on every render. */
function random(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const r0 = (n: number) => Math.round(n)

/** Out-of-focus panel silhouettes: the shapes an interface leaves, none of its content. */
function panels() {
  const rnd = random(41)
  return Array.from({ length: 9 }, () => {
    const w = 140 + rnd() * 260
    const h = 70 + rnd() * 190
    return {
      x: r0(rnd() * (W - w)),
      y: r0(rnd() * (H - h)),
      w: r0(w),
      h: r0(h),
      rows: rnd() > 0.45,
    }
  })
}

/** Orthogonal topology across the field, with a few nodes where paths turn. */
function topology() {
  const rnd = random(77)
  const paths: string[] = []
  const nodes: { x: number; y: number }[] = []
  for (let i = 0; i < 7; i++) {
    let x = r0(rnd() * W * 0.3)
    let y = r0(80 + rnd() * (H - 160))
    let d = `M${x} ${y}`
    for (let s = 0; s < 5; s++) {
      x = Math.min(W, r0(x + 120 + rnd() * 260))
      d += `H${x}`
      if (rnd() > 0.5) {
        y = r0(Math.max(40, Math.min(H - 40, y + (rnd() - 0.5) * 220)))
        d += `V${y}`
        nodes.push({ x, y })
      }
    }
    paths.push(d)
  }
  return { paths, nodes }
}

const PANELS = panels()
const TOPOLOGY = topology()
// The few paths that carry a faint trace of the cold accent.
const TRACES = new Set([1, 4])

/**
 * The Defense Systems environment: a very faint, static field behind the archive that says
 * "complex system" without showing one. Blurred panel silhouettes (some with the rhythm of
 * rows, never their content), two fragments of grid, thin orthogonal topology with square
 * nodes, and two cold traces. Generated geometry only: no screenshots, text, labels or data,
 * and no document or terminal styling. Decorative and hidden from assistive technology.
 */
export function SystemField() {
  return (
    <svg
      className={styles.field}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id="system-field-soft" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <pattern id="system-field-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0V24" className={styles.gridLine} />
        </pattern>
        <radialGradient id="system-field-fade">
          <stop offset="0" stopColor="white" stopOpacity="1" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id="system-field-mask-a">
          <ellipse cx="260" cy="200" rx="260" ry="170" fill="url(#system-field-fade)" />
        </mask>
        <mask id="system-field-mask-b">
          <ellipse cx="1180" cy="720" rx="300" ry="180" fill="url(#system-field-fade)" />
        </mask>
      </defs>
      <g className={styles.panels} filter="url(#system-field-soft)">
        {PANELS.map((p, i) => (
          <g key={i}>
            <rect x={p.x} y={p.y} width={p.w} height={p.h} rx={6} />
            {p.rows
              ? Array.from({ length: Math.floor((p.h - 24) / 18) }, (_, k) => (
                  <path
                    key={k}
                    d={`M${p.x + 14} ${p.y + 22 + k * 18}h${r0(p.w * (k % 3 === 0 ? 0.5 : 0.78))}`}
                    className={styles.row}
                  />
                ))
              : null}
          </g>
        ))}
      </g>
      <rect width={W} height={H} fill="url(#system-field-grid)" mask="url(#system-field-mask-a)" />
      <rect width={W} height={H} fill="url(#system-field-grid)" mask="url(#system-field-mask-b)" />
      <g className={styles.topology}>
        {TOPOLOGY.paths.map((d, i) => (
          <path key={i} d={d} className={TRACES.has(i) ? styles.trace : undefined} />
        ))}
        {TOPOLOGY.nodes.map((n, i) => (
          <rect key={i} x={n.x - 2.5} y={n.y - 2.5} width={5} height={5} />
        ))}
      </g>
    </svg>
  )
}
