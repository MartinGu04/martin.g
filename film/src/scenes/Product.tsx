/**
 * 03 PRODUCT and 04 THE CHAIN REACTION (המחלבה). The match cut from the assembled screen
 * lands in macro on the real next-shift card. The camera racks across it, pulls back
 * through the layered dashboard, swings along the week schedule like a wall, and squares
 * up to it. One drag moves one shift; the change propagates: coverage counters fill, a line
 * carries it to the card, which updates, and on to the phone, which is notified. Every
 * layer then settles into one organized composition (the tile the next scene pulls back
 * from).
 */
import { AbsoluteFill } from 'remotion'
import { assets } from '../config/assets'
import { copy, ui } from '../config/copy'
import { world } from '../config/palette'
import { s } from '../config/timeline'
import { Plane, Stage } from '../lib/camera'
import { clamp, drift, ease, keys, mix, tw } from '../lib/anim'
import { Crop } from '../components/media'
import {
  Clock,
  Cursor,
  Greeting,
  NextShiftCard,
  Notice,
  Schedule,
  ShiftChip,
  SmallCard,
  WEEK,
} from '../components/MiMaMo'
import { Slate } from '../components/Slate'
import { cellInTile, productLayout, type ProductLayout } from './productLayout'
import type { SceneProps } from './types'

const mm = world.miMaMo

/** Chain reaction state at frame f (0 before the drag, 1 when everything has settled). */
export interface ChainState {
  dragging: number // 0..1 along the drag path
  dropped: boolean
  lineCard: number
  lineAux: number
  coverage: number
  updated: number
  notice: number
  pulse: number
  settle: number
}

export function chainAt(f: number, c: { grab: number; drop: number; resolve: number }): ChainState {
  const { grab, drop, resolve } = c
  const span = resolve - drop
  return {
    dragging: tw(f, grab, drop - 1, ease.inOut),
    dropped: f >= drop,
    lineCard: tw(f, drop + span * 0.12, drop + span * 0.55, ease.inOut),
    lineAux: tw(f, drop + span * 0.5, drop + span * 0.85, ease.inOut),
    coverage: tw(f, drop + span * 0.2, drop + span * 0.75, ease.out),
    updated: tw(f, drop + span * 0.5, drop + span * 0.62, ease.mask),
    notice: tw(f, drop + span * 0.8, drop + span * 1.0, ease.out),
    pulse: f >= drop + span * 0.55 ? clamp((f - drop - span * 0.55) / 14) : 0,
    settle: tw(f, resolve - 6, resolve + 4, ease.inOut),
  }
}

export const FINAL: ChainState = {
  dragging: 1,
  dropped: true,
  lineCard: 1,
  lineAux: 1,
  coverage: 1,
  updated: 1,
  notice: 1,
  pulse: 0,
  settle: 1,
}

/** The product composition. `explode` pushes layers apart in depth (0 = organized). */
export function ProductWorld({
  l,
  st,
  f,
  explode,
  cursor,
}: {
  l: ProductLayout
  st: ChainState
  f: number
  explode: number
  cursor?: { x: number; y: number; pressed: number; o: number }
}) {
  const from = cellInTile(l, l.move.from[0], l.move.from[1])
  const to = cellInTile(l, l.move.to[0], l.move.to[1])
  const g = from.g
  const chip = WEEK[l.move.from[0]]!.cells[l.move.from[1]]!
  const chipSize = Math.max(11, g.colW * 0.115)
  const lift = st.dropped ? 0 : Math.sin(Math.PI * st.dragging) * 40 + (st.dragging > 0 ? 18 : 0)
  const chipPos = { x: mix(from.x, to.x, st.dragging), y: mix(from.y, to.y, st.dragging) }
  const z = (d: number) => d * explode

  // Card height from its own proportions (1058 × 286 in the product).
  const cardH = (l.card.w * 286) / 1058
  const cardAnchor = { x: l.card.x + l.card.w * 0.32, y: l.card.y }
  const auxAnchor = l.phone
    ? { x: l.phone.x + l.phone.w * 0.45, y: l.phone.y - 120 }
    : { x: l.notice.x, y: l.notice.y + 30 }
  const path = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const mx = (a.x + b.x) / 2
    return l.fmt === 'portrait'
      ? `M${a.x} ${a.y} V${(a.y + b.y) / 2} H${b.x} V${b.y}`
      : `M${a.x} ${a.y} H${mx} V${b.y} H${b.x}`
  }
  const lenOf = (a: { x: number; y: number }, b: { x: number; y: number }) =>
    Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
  const TW = l.fmt === 'portrait' ? 1080 : 1920
  const TH = l.fmt === 'portrait' ? 1920 : 1080

  return (
    <>
      {/* the product's own backdrop, far behind while exploded */}
      <Plane z={z(-900)} w={TW * 1.25} h={TH * 1.25} opacity={0.22 * explode}>
        <Crop src={assets.mm.dashboard} width={TW * 1.25} style={{ filter: 'saturate(0.8)' }} />
      </Plane>
      <Plane x={l.sched.x} y={l.sched.y} z={z(-260)} w={l.sched.w} h={from.h}>
        <Schedule
          width={l.sched.w}
          cols={l.sched.cols}
          hide={[l.move.from as unknown as readonly [number, number]]}
          highlightRow={st.dropped ? l.move.to[0] : undefined}
          glow={st.dropped ? 1 - st.settle * 0.7 : 0}
          coverage={st.coverage}
        />
      </Plane>
      {/* the moving shift */}
      <Plane
        x={chipPos.x}
        y={chipPos.y}
        z={z(-260) + lift}
        w={g.colW}
        h={chipSize * 2}
        scale={1 + (st.dropped ? 0 : 0.08 * Math.min(1, st.dragging * 4))}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            filter:
              st.dropped || st.dragging === 0
                ? undefined
                : 'drop-shadow(0 18px 18px rgba(0,0,0,0.55))',
          }}
        >
          <ShiftChip
            chip={chip}
            size={chipSize}
            style={
              st.dropped && f >= 0
                ? { boxShadow: `0 0 0 ${(1 - st.settle) * 3}px rgba(255,172,79,0.8)` }
                : undefined
            }
          />
        </div>
      </Plane>
      {/* the propagation */}
      <Plane x={0} y={0} z={z(-120)} w={TW} h={TH} sharp>
        <svg
          width={TW}
          height={TH}
          viewBox={`${-TW / 2} ${-TH / 2} ${TW} ${TH}`}
          style={{ overflow: 'visible' }}
        >
          {[
            { a: to, b: cardAnchor, p: st.lineCard },
            { a: to, b: auxAnchor, p: st.lineAux },
          ].map(({ a, b, p }, i) => {
            if (p <= 0) return null
            const len = lenOf(a, b)
            const head = Math.max(0, 1 - st.settle)
            return (
              <g key={i}>
                <path
                  d={path(a, b)}
                  fill="none"
                  stroke={mm.amber}
                  strokeOpacity={0.25 + 0.6 * head}
                  strokeWidth={2}
                  strokeDasharray={`${len} ${len}`}
                  strokeDashoffset={len * (1 - p)}
                />
              </g>
            )
          })}
        </svg>
      </Plane>
      {l.greeting ? (
        <Plane
          x={l.greeting.x}
          y={l.greeting.y}
          z={z(160)}
          w={l.greeting.w}
          h={l.greeting.w * 0.22}
        >
          <Greeting width={l.greeting.w} />
        </Plane>
      ) : null}
      {l.small.map((c, i) => (
        <Plane key={i} x={c.x} y={c.y} z={z(80 - i * 40)} w={c.w} h={c.w * 0.45}>
          <SmallCard width={c.w} title={c.title} line={c.line} icon={c.icon} />
        </Plane>
      ))}
      <Plane x={l.card.x} y={l.card.y} z={z(0)} w={l.card.w} h={cardH}>
        <div style={{ position: 'relative' }}>
          <NextShiftCard
            width={l.card.w}
            pulse={st.pulse}
            when={st.updated > 0.5 ? 'יום חמישי · 1 באוקטובר' : ui.nextWhen}
          />
          {st.updated > 0 && st.updated < 1 ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 8,
                boxShadow: `inset 0 0 0 2px rgba(255,172,79,${0.8 * Math.sin(Math.PI * st.updated)})`,
              }}
            />
          ) : null}
        </div>
      </Plane>
      {l.phone ? (
        <Plane x={l.phone.x} y={l.phone.y} z={z(-420)} w={l.phone.w} h={(l.phone.w * 867) / 429}>
          <Crop src={assets.mm.mobile} width={l.phone.w} />
        </Plane>
      ) : null}
      <Plane
        x={l.notice.x}
        y={l.notice.y - (1 - st.notice) * 30}
        z={z(-420) + 20}
        w={l.notice.w}
        h={l.notice.w * 0.16}
        opacity={st.notice}
      >
        <Notice width={l.notice.w} text={ui.updated} />
      </Plane>
      <Plane x={l.clock.x} y={l.clock.y} z={z(220)} w={l.clock.size * 6} h={l.clock.size * 1.7}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Clock size={l.clock.size} seconds={f / 24} />
        </div>
      </Plane>
      {cursor && cursor.o > 0 ? (
        <Plane
          x={cursor.x + 16}
          y={cursor.y + 22}
          z={z(-260) + 60}
          w={34}
          h={48}
          opacity={cursor.o}
          sharp
        >
          <Cursor pressed={cursor.pressed} />
        </Plane>
      ) : null}
    </>
  )
}

export function Product({ v, f }: SceneProps) {
  const c = v.cues
  const portrait = v.fmt === 'portrait'
  const l = productLayout(v.fmt)
  const macro = s(c.macro)
  const rack = s(c.rack)
  const covered = s(c.covered)
  const toWall = s(c.toWall)
  const cursorAt = s(c.cursor)
  const grab = s(c.grab)
  const drop = s(c.drop)
  const resolve = s(c.resolve)
  const pullBack = s(c.pullBack)
  if (f < macro) return null

  const st = chainAt(f, { grab, drop, resolve })
  const from = cellInTile(l, l.move.from[0], l.move.from[1])
  const to = cellInTile(l, l.move.to[0], l.move.to[1])
  const explode = 1 - tw(f, drop + 4, resolve + 2, ease.inOut)

  // Camera. Macro fill of the card, then the choreography described above.
  const P = 1613
  const zFill = (w: number) => P / ((portrait ? 1000 : 1880) / w) - P
  const title = { x: l.card.x + l.card.w * (portrait ? 0.18 : 0.2), y: l.card.y - l.card.w * 0.06 }
  const status = { x: l.card.x - l.card.w * 0.3, y: l.card.y + l.card.w * 0.03 }
  const sx = l.sched.x
  const sy = l.sched.y
  const zSched = portrait ? -360 : -520
  const x = keys(f, [
    [macro, l.card.x],
    [rack, title.x, ease.out],
    [covered, status.x, ease.inOut],
    [toWall, l.card.x - 120, ease.inOut],
    [cursorAt, sx + (portrait ? 140 : 360), ease.inOut],
    [grab, (from.x + to.x) / 2 + (portrait ? 0 : 60), ease.inOut],
    [drop, to.x + (portrait ? 0 : 80), ease.inOut],
    [resolve, 0, ease.inOut],
  ])
  const y = keys(f, [
    [macro, l.card.y],
    [rack, title.y, ease.out],
    [covered, status.y, ease.inOut],
    [toWall, l.card.y - 60, ease.inOut],
    [cursorAt, sy, ease.inOut],
    [grab, (from.y + to.y) / 2, ease.inOut],
    [drop, to.y, ease.inOut],
    [resolve, 0, ease.inOut],
  ])
  const z = keys(f, [
    [macro, zFill(l.card.w)],
    [rack, zFill(l.card.w) - (portrait ? 160 : 90), ease.out],
    [covered, zFill(l.card.w) + (portrait ? 80 : 300), ease.inOut],
    [toWall, portrait ? -120 : -40, ease.inOut],
    [cursorAt, zSched - (portrait ? 420 : 330), ease.inOut],
    [grab, zSched - (portrait ? 520 : 470), ease.inOut],
    [drop, zSched - (portrait ? 480 : 420), ease.inOut],
    [resolve, portrait ? 120 : 130, ease.inOut],
    [pullBack, portrait ? 150 : 160, ease.linear],
  ])
  const ry = keys(f, [
    [macro, 0],
    [rack, -6, ease.out],
    [covered, portrait ? 8 : 10, ease.inOut],
    [toWall, portrait ? 4 : 8, ease.inOut],
    [toWall + (cursorAt - toWall) * 0.5, portrait ? 6 : 34, ease.inOut],
    [cursorAt, 0, ease.inOut],
  ])
  const rx = keys(f, [
    [macro, 0],
    [rack, 4, ease.out],
    [covered, -3, ease.inOut],
    [toWall + (cursorAt - toWall) * 0.5, portrait ? 10 : 4, ease.inOut],
    [cursorAt, 0, ease.inOut],
  ])
  // Focus: the card, then the layers in front of it, then the schedule as we reach it.
  const focusZ = keys(f, [
    [macro, 0],
    [covered, 0],
    [toWall, -260 * explode, ease.inOut],
  ])
  const cam = {
    x: x + drift(f, 11, 4),
    y: y + drift(f, 12, 3),
    z,
    rx,
    ry,
    dof: 6 * (1 - tw(f, cursorAt - 6, cursorAt + 6)),
    focusZ,
  }

  // Cursor: enters, presses, drags, releases, leaves.
  const enter = { x: from.x + (portrait ? 260 : 380), y: from.y + (portrait ? 320 : 260) }
  const cpos = {
    x: keys(f, [
      [cursorAt, enter.x],
      [grab - 2, from.x, ease.inOut],
      [drop - 1, to.x, ease.inOut],
      [drop + 10, to.x + 140, ease.inOut],
    ]),
    y: keys(f, [
      [cursorAt, enter.y],
      [grab - 2, from.y, ease.inOut],
      [drop - 1, to.y, ease.inOut],
      [drop + 10, to.y + 100, ease.inOut],
    ]),
  }
  const cursor = {
    ...cpos,
    pressed: tw(f, grab - 2, grab, ease.out) * (1 - tw(f, drop - 1, drop + 1)),
    o: tw(f, cursorAt, cursorAt + 4) * (1 - tw(f, drop + 6, drop + 12)),
  }

  const bgLight = keys(f, [
    [macro, 0.22],
    [resolve, 0.12],
  ])

  return (
    <AbsoluteFill style={{ background: mm.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 60% at 60% 25%, rgba(127,166,214,${bgLight}), rgba(127,166,214,0) 70%)`,
        }}
      />
      <Stage cam={cam}>
        <ProductWorld l={l} st={st} f={f} explode={explode} cursor={cursor} />
      </Stage>
      <Slate
        fmt={v.fmt}
        f={f}
        at={rack}
        until={toWall}
        index={copy.slates.miMaMo[0]}
        name={copy.slates.miMaMo[1]}
        tone={mm.text}
      />
    </AbsoluteFill>
  )
}
