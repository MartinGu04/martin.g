/**
 * המחלבה (id mi-ma-mo), rebuilt from its approved screenshots so the camera can come close
 * and the interface can actually work on screen: the week schedule, the next-shift card,
 * the greeting. Colors are sampled from the real interface; labels are its own; people are
 * the same anonymous placeholders the screenshots show. Nothing here is real data.
 */
import type { CSSProperties, ReactNode } from 'react'
import { ui } from '../config/copy'
import { world } from '../config/palette'
import { UI } from '../lib/fonts'

const mm = world.miMaMo

export type ChipKind =
  'kitchen' | 'referral' | 'day' | 'abroad' | 'off' | 'night' | 'after' | 'plain' | 'cert'
const CHIP: Record<ChipKind, { bg: string; icon?: string }> = {
  kitchen: { bg: 'rgb(19,43,31)', icon: '🍽️' },
  referral: { bg: 'rgb(49,36,49)', icon: '🎆' },
  day: { bg: 'rgb(47,44,31)', icon: '🌞' },
  abroad: { bg: 'rgb(22,47,47)', icon: '🏖️' },
  off: { bg: 'rgb(22,47,47)', icon: '🏖️' },
  night: { bg: 'rgb(27,44,63)', icon: '🌙' },
  after: { bg: 'rgb(49,37,36)', icon: '🌅' },
  plain: { bg: 'rgb(36,42,49)' },
  cert: { bg: 'rgb(36,42,49)' },
}

export interface Chip {
  kind: ChipKind
  label: string
  shadow?: boolean
}

const K = (kind: ChipKind, label: string, shadow = false): Chip => ({ kind, label, shadow })
const _ = null

/** The week, as the screenshot shows it (right to left: date, three leads, five technicians). */
export const WEEK: { day: string; date: string; today?: boolean; cells: (Chip | null)[] }[] = [
  {
    day: "א'",
    date: '27.9',
    cells: [
      K('kitchen', 'מטבח מלא'),
      K('referral', 'הפניה'),
      K('day', 'אחמ"ש יום'),
      K('abroad', 'חו"ל'),
      _,
      _,
      K('after', 'אפטר'),
      K('day', 'אחמ"ש יום', true),
    ],
  },
  {
    day: "ב'",
    date: '28.9',
    cells: [
      _,
      K('off', 'חופש'),
      _,
      K('abroad', 'חו"ל'),
      K('kitchen', 'מטבח יומי'),
      K('night', 'אחמ"ש לילה'),
      _,
      K('day', 'אחמ"ש יום', true),
    ],
  },
  {
    day: "ג'",
    date: '29.9',
    cells: [
      K('day', 'אחמ"ש יום'),
      K('off', 'חופש'),
      K('night', 'אחמ"ש לילה'),
      K('abroad', 'חו"ל'),
      K('night', 'טכנאי לילה'),
      _,
      K('kitchen', 'מטבח יומי'),
      _,
    ],
  },
  {
    day: "ד'",
    date: '30.9',
    cells: [
      _,
      K('off', 'חופש'),
      _,
      K('abroad', 'חו"ל'),
      K('night', 'טכנאי לילה'),
      K('day', 'אחמ"ש יום', true),
      _,
      K('kitchen', 'מטבח יומי'),
    ],
  },
  {
    day: "ה'",
    date: '1.10',
    today: true,
    cells: [K('plain', 'אחמ"ש'), _, _, K('abroad', 'חו"ל'), _, _, K('kitchen', 'מטבח יומי'), _],
  },
  {
    day: "ו'",
    date: '2.10',
    cells: [
      K('plain', 'אחמ"ש'),
      _,
      _,
      K('abroad', 'חו"ל'),
      _,
      _,
      K('night', 'אחמ"ש לילה', true),
      _,
    ],
  },
  {
    day: "ש'",
    date: '3.10',
    cells: [
      K('plain', 'אחמ"ש'),
      _,
      _,
      K('abroad', 'חו"ל'),
      _,
      _,
      K('night', 'אחמ"ש לילה', true),
      _,
    ],
  },
]

const base: CSSProperties = { fontFamily: UI, direction: 'rtl', color: mm.text }

export function ShiftChip({
  chip,
  size = 15,
  style,
}: {
  chip: Chip
  size?: number
  style?: CSSProperties
}) {
  const c = CHIP[chip.kind]
  return (
    <div
      style={{
        ...base,
        display: 'inline-flex',
        alignItems: 'center',
        gap: size * 0.4,
        height: size * 2,
        paddingInline: size * 0.7,
        borderRadius: size * 0.4,
        background: c.bg,
        border: '1px solid rgba(255,255,255,0.07)',
        fontSize: size,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {c.icon ? <span style={{ fontSize: size * 0.95 }}>{c.icon}</span> : null}
      <span>{chip.label}</span>
      {chip.shadow ? (
        <span
          style={{
            fontSize: size * 0.7,
            paddingInline: size * 0.3,
            borderRadius: 4,
            background: 'rgba(255,255,255,0.12)',
          }}
        >
          צל
        </span>
      ) : null}
    </div>
  )
}

export interface ScheduleGeom {
  dateW: number
  colW: number
  rowH: number
  headH: number
  cols: number
}

export function scheduleGeom(width: number, cols: number): ScheduleGeom {
  const dateW = Math.round(width * 0.085)
  return {
    dateW,
    colW: (width - dateW) / cols,
    rowH: Math.round(width * 0.068),
    headH: Math.round(width * 0.085),
    cols,
  }
}

/** Center of a cell, relative to the schedule's top-left corner (RTL: column 0 is rightmost). */
export function cellCenter(g: ScheduleGeom, width: number, row: number, col: number) {
  return { x: width - g.dateW - (col + 0.5) * g.colW, y: g.headH + (row + 0.5) * g.rowH }
}

export function Schedule({
  width,
  cols = 8,
  hide = [],
  highlightRow,
  glow = 0,
  coverage = 0,
  children,
}: {
  width: number
  cols?: number
  /** Cells drawn empty because their chip is being moved: [row, col]. */
  hide?: readonly (readonly [number, number])[]
  highlightRow?: number
  glow?: number
  /** 0 → 1: the header counters turn to full coverage. */
  coverage?: number
  children?: ReactNode
}) {
  const g = scheduleGeom(width, cols)
  const chip = Math.max(11, g.colW * 0.115)
  const height = g.headH + WEEK.length * g.rowH
  return (
    <div
      style={{
        ...base,
        position: 'relative',
        width,
        height,
        background: 'rgb(21,28,35)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      {/* header */}
      <div
        style={{
          position: 'absolute',
          insetInline: 0,
          insetBlockStart: 0,
          height: g.headH,
          background: 'rgb(27,36,45)',
          borderBlockEnd: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            insetInlineStart: 0,
            width: g.dateW,
            height: g.headH,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: chip,
            fontWeight: 700,
          }}
        >
          {ui.date}
        </div>
        <div
          style={{
            position: 'absolute',
            insetInlineStart: g.dateW + g.colW * 3,
            insetInlineEnd: 0,
            insetBlockStart: 0,
            height: g.headH * 0.45,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: chip * 0.95,
            fontWeight: 700,
            color: mm.muted,
          }}
        >
          {ui.technicians}
        </div>
        {Array.from({ length: cols }, (_, c) => {
          const on = coverage > (c + 1) / (cols + 1)
          return (
            <div
              key={c}
              style={{
                position: 'absolute',
                insetInlineStart: g.dateW + c * g.colW + g.colW * 0.18,
                width: g.colW * 0.64,
                insetBlockStart: g.headH * 0.58,
                height: g.headH * 0.24,
                borderRadius: 99,
                background: on ? 'rgba(62,207,142,0.55)' : 'rgba(255,255,255,0.10)',
              }}
            />
          )
        })}
      </div>
      {/* separator between leads and technicians */}
      <div
        style={{
          position: 'absolute',
          insetBlock: 0,
          insetInlineStart: g.dateW + g.colW * 3,
          width: 1,
          background: 'rgba(255,255,255,0.12)',
        }}
      />
      {WEEK.map((r, ri) => (
        <div
          key={ri}
          style={{
            position: 'absolute',
            insetInline: 0,
            insetBlockStart: g.headH + ri * g.rowH,
            height: g.rowH,
            borderBlockEnd: '1px solid rgba(255,255,255,0.05)',
            background: ri === highlightRow ? `rgba(127,166,214,${0.06 + glow * 0.16})` : undefined,
          }}
        >
          <div
            style={{
              position: 'absolute',
              insetInlineStart: 0,
              width: g.dateW,
              height: '100%',
              background: r.today ? 'rgb(40,57,71)' : 'rgb(27,32,38)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1.15,
            }}
          >
            <span style={{ fontSize: chip * 1.05, fontWeight: 700 }}>{r.day}</span>
            <span style={{ fontSize: chip * 0.9, color: mm.muted }}>{r.date}</span>
            {r.today ? (
              <span style={{ fontSize: chip * 0.7, color: mm.light }}>{ui.today}</span>
            ) : null}
          </div>
          {r.cells.slice(0, cols).map((ch, ci) =>
            ch && !hide.some(([a, b]) => a === ri && b === ci) ? (
              <div
                key={ci}
                style={{
                  position: 'absolute',
                  insetInlineStart: g.dateW + ci * g.colW,
                  width: g.colW,
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShiftChip chip={ch} size={chip} />
              </div>
            ) : null,
          )}
        </div>
      ))}
      {children}
    </div>
  )
}

export function Card({
  width,
  children,
  style,
}: {
  width: number
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        ...base,
        width,
        borderRadius: width * 0.016,
        background: 'linear-gradient(180deg, rgb(19,36,58) 0%, rgb(15,28,45) 100%)',
        border: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 40px 90px rgba(0,0,0,0.5)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** "Your next shift": the card a technician opens first. */
export function NextShiftCard({
  width,
  when = ui.nextWhen,
  covered = 1,
  pulse = 0,
}: {
  width: number
  when?: string
  covered?: number
  pulse?: number
}) {
  const u = width / 1058
  return (
    <Card width={width} style={{ padding: `${28 * u}px ${30 * u}px` }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10 * u,
          fontSize: 15 * u,
          color: mm.muted,
          fontWeight: 600,
        }}
      >
        <span style={{ fontSize: 16 * u }}>🗓️</span>
        {ui.next}
      </div>
      <div
        style={{
          marginBlockStart: 18 * u,
          display: 'flex',
          alignItems: 'center',
          gap: 14 * u,
          fontSize: 31 * u,
          fontWeight: 800,
        }}
      >
        <span style={{ fontSize: 28 * u }}>🌙</span>
        {ui.nextShift}
      </div>
      <div
        style={{
          marginBlockStart: 12 * u,
          fontSize: 15 * u,
          color: mm.muted,
          display: 'flex',
          gap: 12 * u,
        }}
      >
        <span>{when}</span>
        <span>·</span>
        <span style={{ direction: 'ltr' }}>{ui.nextHours}</span>
      </div>
      <div
        style={{ height: 1, background: 'rgba(255,255,255,0.09)', marginBlock: `${24 * u}px` }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 15 * u,
        }}
      >
        <span style={{ fontWeight: 700 }}>{ui.withMe}</span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8 * u,
            color: mm.green,
            fontWeight: 600,
            opacity: 0.35 + 0.65 * covered,
          }}
        >
          <span
            style={{
              width: 14 * u,
              height: 14 * u,
              borderRadius: 99,
              border: `${1.6 * u}px solid ${mm.green}`,
              boxShadow:
                pulse > 0
                  ? `0 0 0 ${pulse * 18 * u}px rgba(62,207,142,${0.35 * (1 - pulse)})`
                  : undefined,
            }}
          />
          {ui.covered}
        </span>
      </div>
      <div
        style={{
          marginBlockStart: 16 * u,
          height: 58 * u,
          borderRadius: 10 * u,
          background: 'rgba(255,255,255,0.035)',
          border: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          alignItems: 'center',
          gap: 14 * u,
          paddingInline: 14 * u,
        }}
      >
        <span
          style={{
            width: 32 * u,
            height: 32 * u,
            borderRadius: 99,
            background: 'rgba(255,255,255,0.08)',
          }}
        />
        <div style={{ display: 'grid', gap: 6 * u }}>
          <span
            style={{
              width: 80 * u,
              height: 12 * u,
              borderRadius: 99,
              background: 'rgba(255,255,255,0.14)',
            }}
          />
          <span style={{ fontSize: 12 * u, color: mm.muted }}>טכנאי · לילה</span>
        </div>
      </div>
    </Card>
  )
}

export function Greeting({ width }: { width: number }) {
  const u = width / 260
  return (
    <div style={{ ...base, width, textAlign: 'start' }}>
      <div
        style={{
          fontSize: 24 * u,
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          gap: 8 * u,
        }}
      >
        {ui.greeting} <span style={{ fontSize: 22 * u }}>🌞</span>
      </div>
      <div style={{ marginBlockStart: 6 * u, fontSize: 12 * u, color: mm.muted }}>
        יום חמישי · 1 באוקטובר
      </div>
    </div>
  )
}

export function SmallCard({
  width,
  title,
  line,
  icon,
}: {
  width: number
  title: string
  line: string
  icon: string
}) {
  const u = width / 226
  return (
    <Card
      width={width}
      style={{ padding: `${14 * u}px ${16 * u}px`, boxShadow: '0 24px 60px rgba(0,0,0,0.45)' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6 * u,
          fontSize: 13 * u,
          fontWeight: 700,
        }}
      >
        <span style={{ fontSize: 12 * u }}>{icon}</span>
        {title}
      </div>
      <div style={{ marginBlockStart: 6 * u, fontSize: 11 * u, color: mm.muted }}>{line}</div>
      <div style={{ marginBlockStart: 14 * u, fontSize: 11 * u, color: mm.text }}>{ui.open} ‹</div>
    </Card>
  )
}

/** The live clock in the product's header, ticking with the film's seconds. */
export function Clock({ size, seconds }: { size: number; seconds: number }) {
  const t = 11 * 3600 + 19 * 60 + 55 + Math.floor(seconds)
  const hh = String(Math.floor(t / 3600) % 24).padStart(2, '0')
  const mmn = String(Math.floor(t / 60) % 60).padStart(2, '0')
  const ss = String(t % 60).padStart(2, '0')
  return (
    <div
      style={{
        fontFamily: UI,
        direction: 'ltr',
        fontVariantNumeric: 'tabular-nums',
        fontSize: size,
        fontWeight: 700,
        color: mm.text,
        padding: `${size * 0.3}px ${size * 0.6}px`,
        borderRadius: size * 0.4,
        background: 'rgba(15,29,46,0.9)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {hh}:{mmn}:{ss}
    </div>
  )
}

/** A pointer: white arrow with a dark edge, pressed state slightly smaller. */
export function Cursor({ size = 34, pressed = 0 }: { size?: number; pressed?: number }) {
  return (
    <svg
      width={size}
      height={size * 1.4}
      viewBox="0 0 20 28"
      style={{
        overflow: 'visible',
        transform: `scale(${1 - pressed * 0.12})`,
        transformOrigin: '2px 2px',
      }}
    >
      <path
        d="M2 2 L2 23 L7.5 17.8 L11.2 26 L14.6 24.5 L11 16.6 L18 16.4 Z"
        fill="#fff"
        stroke="#0b121c"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Notice({ width, text }: { width: number; text: string }) {
  const u = width / 300
  return (
    <div
      style={{
        ...base,
        width,
        display: 'flex',
        alignItems: 'center',
        gap: 10 * u,
        padding: `${12 * u}px ${16 * u}px`,
        borderRadius: 14 * u,
        background: 'rgba(20,34,52,0.97)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        fontSize: 15 * u,
        fontWeight: 600,
      }}
    >
      <span style={{ width: 10 * u, height: 10 * u, borderRadius: 99, background: mm.green }} />
      {text}
    </div>
  )
}
