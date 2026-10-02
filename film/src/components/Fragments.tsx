/**
 * The raw material of a problem: interface pieces, data rows, code, system nodes, status
 * and time. Interface pieces are crops of the real screens; everything else is generic,
 * sanitized texture (no real names, data or identifiers).
 */
import type { CSSProperties } from 'react'
import { brand, world } from '../config/palette'
import { DISPLAY } from '../lib/fonts'

const mono: CSSProperties = {
  fontFamily: DISPLAY,
  fontStretch: '100%',
  fontWeight: 450,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '0.01em',
  whiteSpace: 'pre',
}

export const CODE = [
  ['const week = await sheets.read(range)', 'shifts.filter((s) => s.open).map(assign)'],
  ['if (coverage(day) < required) {', '  notify(team, day)', '}'],
  ['export function NextShift({ shift }) {', '  return <Card tone="night" />'],
  ["status: 'covered'", 'updatedAt: now()'],
  ['grid-template-columns: repeat(7, 1fr);', 'gap: var(--space-2);'],
  ['GET /api/schedule/week  200  18ms'],
  ['await sync({ source, since })', 'queue.drain()'],
] as const

export const ROWS = [
  ['27.9', '07:30', '19:30', '12', '●'],
  ['28.9', '19:30', '07:30', '08', '●'],
  ['29.9', '07:30', '15:00', '11', '○'],
  ['30.9', '15:00', '23:00', '09', '●'],
  ['1.10', '07:30', '19:30', '12', '●'],
  ['2.10', '19:30', '07:30', '10', '○'],
] as const

export function CodeBlock({
  lines,
  size = 20,
  tone = brand.ink,
}: {
  lines: readonly string[]
  size?: number
  tone?: string
}) {
  return (
    <div
      style={{
        ...mono,
        fontSize: size,
        lineHeight: 1.55,
        color: tone,
        padding: size * 0.8,
        background: 'rgba(18,18,18,0.92)',
        border: `1px solid ${brand.line}`,
      }}
    >
      {lines.map((l, i) => (
        <div key={i}>
          <span style={{ opacity: 0.35, marginInlineEnd: size }}>
            {String(i + 1).padStart(2, ' ')}
          </span>
          {l}
        </div>
      ))}
    </div>
  )
}

export function DataRow({
  cells,
  size = 20,
  accent = world.miMaMo.green,
}: {
  cells: readonly string[]
  size?: number
  accent?: string
}) {
  return (
    <div
      style={{
        ...mono,
        fontSize: size,
        display: 'flex',
        color: brand.ink,
        background: 'rgba(15,29,46,0.92)',
        border: `1px solid ${world.miMaMo.line}`,
      }}
    >
      {cells.map((c, i) => (
        <div
          key={i}
          style={{
            paddingInline: size * 0.8,
            paddingBlock: size * 0.45,
            borderInlineStart: i ? `1px solid ${world.miMaMo.line}` : undefined,
            color: c === '●' ? accent : c === '○' ? world.miMaMo.amber : undefined,
            opacity: i === 0 ? 0.6 : 1,
          }}
        >
          {c}
        </div>
      ))}
    </div>
  )
}

export function Nodes({
  w,
  h,
  seed = 1,
  color = brand.ink,
  accent = world.miMaMo.amber,
}: {
  w: number
  h: number
  seed?: number
  color?: string
  accent?: string
}) {
  const pts = Array.from({ length: 6 }, (_, i) => ({
    x: 20 + ((i * 97 + seed * 31) % (w - 40)),
    y: 20 + ((i * 53 + seed * 17) % (h - 40)),
  }))
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      {pts.slice(1).map((p, i) => {
        const a = pts[i]!
        return (
          <path
            key={i}
            d={`M${a.x} ${a.y} H${(a.x + p.x) / 2} V${p.y} H${p.x}`}
            fill="none"
            stroke={color}
            strokeOpacity={0.45}
            strokeWidth={1.5}
          />
        )
      })}
      {pts.map((p, i) => (
        <rect
          key={i}
          x={p.x - 5}
          y={p.y - 5}
          width={10}
          height={10}
          fill={i === 2 ? accent : i % 2 ? 'none' : color}
          stroke={color}
          strokeWidth={1.5}
        />
      ))}
    </svg>
  )
}

export function Bars({ w, n = 4, seed = 1 }: { w: number; n?: number; seed?: number }) {
  return (
    <div style={{ width: w, display: 'grid', gap: 8 }}>
      {Array.from({ length: n }, (_, i) => {
        const s = ((i + 1) * 37 * seed) % 40
        const l = 30 + (((i + 3) * 53 * seed) % 50)
        return (
          <div
            key={i}
            style={{ height: 10, position: 'relative', background: 'rgba(255,255,255,0.05)' }}
          >
            <div
              style={{
                position: 'absolute',
                insetBlock: 0,
                insetInlineStart: `${s}%`,
                width: `${l}%`,
                background: i === 1 ? world.miMaMo.amber : world.miMaMo.light,
                opacity: i === 1 ? 0.9 : 0.55,
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

export function Pill({
  text,
  tone = world.miMaMo.green,
  size = 18,
}: {
  text: string
  tone?: string
  size?: number
}) {
  return (
    <div
      style={{
        ...mono,
        display: 'inline-flex',
        alignItems: 'center',
        gap: size * 0.5,
        fontSize: size,
        color: brand.ink,
        paddingInline: size * 0.8,
        paddingBlock: size * 0.4,
        background: 'rgba(15,29,46,0.95)',
        border: `1px solid ${world.miMaMo.line}`,
        borderRadius: 999,
      }}
    >
      <span style={{ width: size * 0.5, height: size * 0.5, borderRadius: 99, background: tone }} />
      {text}
    </div>
  )
}
