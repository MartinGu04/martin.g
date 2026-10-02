/**
 * 05 PEOPLE / OUTCOME. Not interfaces: what they change. A desk of manual work, too many
 * windows, rows, threads, tabs, notes and badges, all slightly restless. פחות להתעסק
 * במערכת. Then it folds away into one calm card that answers the only question that
 * mattered. יותר לעשות את העבודה. The card opens like a window onto the real world: real
 * hands, a real place. BUILT FOR PEOPLE. (No testimonials, no statistics, no invented people.)
 */
import { AbsoluteFill } from 'remotion'
import { assets } from '../config/assets'
import { copy } from '../config/copy'
import { brand, world } from '../config/palette'
import { s, type Format, type Version } from '../config/timeline'
import { clamp, drift, ease, mix, rng, tw } from '../lib/anim'
import { Crop } from '../components/media'
import { NextShiftCard } from '../components/MiMaMo'
import { Campaign, CaptionAt, HeLine } from '../components/Caption'
import { DISPLAY } from '../lib/fonts'
import type { SceneProps } from './types'

type Kind = 'sheet' | 'thread' | 'tabs' | 'note' | 'badge' | 'calendar' | 'list'
interface Piece {
  kind: Kind
  x: number
  y: number
  w: number
  h: number
  rot: number
  i: number
}

function pieces(fmt: Format): Piece[] {
  const r = rng(fmt === 'portrait' ? 303 : 301)
  const L: Omit<Piece, 'i' | 'rot'>[] =
    fmt === 'portrait'
      ? [
          { kind: 'tabs', x: 0, y: -720, w: 1000, h: 70 },
          { kind: 'sheet', x: -120, y: -380, w: 760, h: 480 },
          { kind: 'thread', x: 230, y: 40, w: 520, h: 520 },
          { kind: 'note', x: -330, y: -20, w: 240, h: 220 },
          { kind: 'calendar', x: -190, y: 300, w: 520, h: 300 },
          { kind: 'list', x: 300, y: -60, w: 340, h: 300 },
          { kind: 'note', x: 320, y: 170, w: 220, h: 200 },
          { kind: 'badge', x: 380, y: -560, w: 70, h: 70 },
          { kind: 'badge', x: -420, y: -110, w: 64, h: 64 },
          { kind: 'badge', x: 120, y: 330, w: 60, h: 60 },
        ]
      : [
          { kind: 'tabs', x: 0, y: -440, w: 1700, h: 64 },
          { kind: 'sheet', x: -430, y: -60, w: 860, h: 520 },
          { kind: 'thread', x: 520, y: -110, w: 470, h: 520 },
          { kind: 'note', x: -800, y: 250, w: 250, h: 230 },
          { kind: 'note', x: 120, y: 290, w: 230, h: 210 },
          { kind: 'calendar', x: 420, y: 300, w: 520, h: 300 },
          { kind: 'list', x: -40, y: -230, w: 360, h: 300 },
          { kind: 'badge', x: 760, y: -330, w: 70, h: 70 },
          { kind: 'badge', x: -110, y: -330, w: 64, h: 64 },
          { kind: 'badge', x: -820, y: -250, w: 60, h: 60 },
        ]
  return L.map((p, i) => ({ ...p, rot: (r() - 0.5) * 7, i }))
}
const PIECES = { landscape: pieces('landscape'), portrait: pieces('portrait') }

const bar = (w: number | string, o = 0.18, h = 10) => (
  <div style={{ width: w, height: h, borderRadius: 3, background: `rgba(245,243,238,${o})` }} />
)

function PieceBody({ p }: { p: Piece }) {
  const win = {
    width: p.w,
    height: p.h,
    background: '#1b1b1d',
    border: '1px solid rgba(255,255,255,0.10)',
    boxShadow: '0 30px 70px rgba(0,0,0,0.55)',
    overflow: 'hidden',
    position: 'relative' as const,
  }
  const chrome = (
    <div
      style={{
        height: 30,
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        paddingInline: 12,
        background: '#232326',
        borderBlockEnd: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{ width: 9, height: 9, borderRadius: 9, background: 'rgba(255,255,255,0.18)' }}
        />
      ))}
    </div>
  )
  switch (p.kind) {
    case 'sheet': {
      const cols = 7
      const rows = 12
      return (
        <div style={win}>
          {chrome}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              fontFamily: DISPLAY,
              fontSize: 15,
              fontVariantNumeric: 'tabular-nums',
              color: 'rgba(245,243,238,0.55)',
            }}
          >
            {Array.from({ length: cols * rows }, (_, i) => (
              <div
                key={i}
                style={{
                  height: 34,
                  borderInlineEnd: '1px solid rgba(255,255,255,0.06)',
                  borderBlockEnd: '1px solid rgba(255,255,255,0.06)',
                  paddingInline: 8,
                  display: 'flex',
                  alignItems: 'center',
                  background:
                    i % 11 === 3
                      ? 'rgba(255,172,79,0.18)'
                      : i % 17 === 5
                        ? 'rgba(224,90,90,0.16)'
                        : undefined,
                }}
              >
                {i < cols
                  ? ''
                  : (i * 37) % 9 === 0
                    ? ''
                    : ((i * 53) % 24) + ':' + (i % 2 ? '30' : '00')}
              </div>
            ))}
          </div>
        </div>
      )
    }
    case 'thread':
      return (
        <div style={win}>
          {chrome}
          <div style={{ padding: 18, display: 'grid', gap: 14 }}>
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: i % 3 === 1 ? 'flex-end' : 'flex-start',
                  gap: 10,
                  alignItems: 'center',
                }}
              >
                {i % 3 !== 1 ? (
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 26,
                      background: 'rgba(255,255,255,0.14)',
                    }}
                  />
                ) : null}
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 14,
                    background: i % 3 === 1 ? 'rgba(127,166,214,0.22)' : 'rgba(255,255,255,0.07)',
                    display: 'grid',
                    gap: 6,
                  }}
                >
                  {bar(120 + ((i * 47) % 140), 0.3, 8)}
                  {i % 2 ? bar(80 + ((i * 29) % 90), 0.2, 8) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    case 'tabs':
      return (
        <div style={{ width: p.w, height: p.h, display: 'flex', gap: 6, alignItems: 'flex-end' }}>
          {Array.from({ length: 11 }, (_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: p.h * 0.72,
                background: i === 4 ? '#2a2a2e' : '#1d1d20',
                borderStartStartRadius: 8,
                borderStartEndRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                paddingInline: 12,
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background: 'rgba(255,255,255,0.25)',
                }}
              />
              {bar('60%', 0.2, 8)}
            </div>
          ))}
        </div>
      )
    case 'note':
      return (
        <div
          style={{
            width: p.w,
            height: p.h,
            background: p.i % 2 ? '#d9b46a' : '#e6c9a5',
            padding: 22,
            display: 'grid',
            alignContent: 'start',
            gap: 14,
            boxShadow: '0 24px 50px rgba(0,0,0,0.5)',
          }}
        >
          {[0.8, 0.6, 0.9, 0.5, 0.7].map((w, i) => (
            <div
              key={i}
              style={{
                width: `${w * 100}%`,
                height: 7,
                borderRadius: 4,
                background: 'rgba(35,26,22,0.45)',
                transform: `rotate(${(i % 2 ? 1 : -1) * 1.2}deg)`,
              }}
            />
          ))}
        </div>
      )
    case 'badge':
      return (
        <div
          style={{
            width: p.w,
            height: p.h,
            borderRadius: p.w,
            background: world.miMaMo.amber,
            color: '#1b1205',
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: p.w * 0.42,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
          }}
        >
          {[12, 3, 7][p.i % 3]}
        </div>
      )
    case 'calendar':
      return (
        <div style={win}>
          {chrome}
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, padding: 10 }}
          >
            {Array.from({ length: 28 }, (_, i) => (
              <div
                key={i}
                style={{
                  height: (p.h - 60) / 4 - 4,
                  background: 'rgba(255,255,255,0.04)',
                  padding: 5,
                  display: 'grid',
                  alignContent: 'start',
                  gap: 4,
                }}
              >
                {i % 3 !== 2 ? (
                  <div
                    style={{
                      height: 7,
                      borderRadius: 3,
                      background: [
                        'rgba(127,166,214,0.5)',
                        'rgba(255,172,79,0.5)',
                        'rgba(62,207,142,0.45)',
                      ][i % 3],
                    }}
                  />
                ) : null}
                {i % 4 === 1 ? (
                  <div style={{ height: 7, borderRadius: 3, background: 'rgba(224,90,90,0.4)' }} />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )
    case 'list':
      return (
        <div style={win}>
          {chrome}
          <div style={{ padding: 16, display: 'grid', gap: 12 }}>
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{ width: 14, height: 14, border: '1.5px solid rgba(255,255,255,0.35)' }}
                />
                {bar(110 + ((i * 41) % 150), 0.22, 8)}
              </div>
            ))}
          </div>
        </div>
      )
  }
}

/** The desk of manual work, at frame f (also shown frozen as a tile on the wall). */
export function ClutterFrame({
  fmt,
  f,
  v,
  collapse = 0,
}: {
  fmt: Format
  f: number
  v: Version
  collapse?: number
}) {
  const W = fmt === 'portrait' ? 1080 : 1920
  const H = fmt === 'portrait' ? 1920 : 1080
  void v
  return (
    <div
      style={{
        position: 'relative',
        width: W,
        height: H,
        background: '#121213',
        overflow: 'hidden',
      }}
    >
      {PIECES[fmt].map((p) => {
        // restless: small drifts and nudges, as if someone keeps switching between them
        const jitter = drift(f * 2.2, p.i * 3.1, 7)
        const nudge = Math.sin((f + p.i * 13) / 9) > 0.96 ? 6 : 0
        const delay = (p.i % 5) * 1.5
        const k = ease.in(clamp((collapse * 16 - delay) / 10))
        const x = mix(p.x + jitter + nudge, 0, k)
        const y = mix(p.y + drift(f * 2.2, p.i * 5.3, 5), 0, k)
        const sc = mix(1, 0.08, k)
        return (
          <div
            key={p.i}
            style={{
              position: 'absolute',
              insetInlineStart: W / 2 + x - p.w / 2,
              insetBlockStart: H / 2 + y - p.h / 2,
              transform: `rotate(${p.rot * (1 - k)}deg) scale(${sc})`,
              opacity: 1 - k * k,
            }}
          >
            <PieceBody p={p} />
          </div>
        )
      })}
    </div>
  )
}

/** The real place behind the card: the same framing in this scene and the next. */
export function peoplePhoto(v: Version, f: number) {
  const c = v.cues
  return {
    src: assets.on.patisserie,
    zoom: 1.0 + 0.06 * tw(f, s(c.people), s(c.process) + 30, ease.linear),
  }
}

export function PhotoCover({ v, f, w, h }: { v: Version; f: number; w: number; h: number }) {
  const { src, zoom } = peoplePhoto(v, f)
  const k = Math.max(w / src.w, h / src.h) * zoom
  const rw = w / k
  const rh = h / k
  return <Crop src={src} region={[(src.w - rw) / 2, (src.h - rh) * 0.45, rw, rh]} width={w} />
}

export function Outcome({ v, f }: SceneProps) {
  const c = v.cues
  const portrait = v.fmt === 'portrait'
  const W = v.width
  const H = v.height
  const clutter = s(c.clutter)
  const collapse = s(c.collapse)
  const people = s(c.people)
  const process = s(c.process)
  if (f < clutter) return null

  const fold = tw(f, collapse - 6, collapse + 4, ease.linear)
  const calm = tw(f, collapse, collapse + 14, ease.inOut)
  const cardW = portrait ? 960 : 1120
  const cardH = (cardW * 286) / 1058
  const cardIn = tw(f, collapse - 2, collapse + 12, ease.out)

  // The card becomes a window onto the real world, opening to the full frame.
  const open = tw(f, people - 4, people + 22, ease.scene)
  const winW = mix(cardW, W, open)
  const winH = mix(cardH, H, open)
  const winY = mix(portrait ? -120 : -60, 0, open)

  return (
    <AbsoluteFill style={{ background: '#121213' }}>
      {calm < 1 ? (
        <AbsoluteFill style={{ opacity: 1 - calm }}>
          <ClutterFrame fmt={v.fmt} f={f} v={v} collapse={fold} />
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ background: world.miMaMo.bg, opacity: calm }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 55% 50% at 50% 45%, rgba(127,166,214,${0.24 * calm}), rgba(127,166,214,0) 70%)`,
        }}
      />
      {cardIn > 0 ? (
        <div
          style={{
            position: 'absolute',
            insetInlineStart: W / 2 - winW / 2,
            insetBlockStart: H / 2 + winY - winH / 2,
            width: winW,
            height: winH,
            overflow: 'hidden',
            borderRadius: mix(14, 0, open),
            opacity: cardIn,
            transform: `scale(${mix(0.92, 1, cardIn)})`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              insetInlineStart: winW / 2 - cardW / 2,
              insetBlockStart: winH / 2 - cardH / 2,
              opacity: 1 - tw(f, people - 4, people + 6),
            }}
          >
            <NextShiftCard width={cardW} />
          </div>
          {open > 0 ? (
            <div style={{ position: 'absolute', inset: 0, opacity: tw(f, people - 4, people + 4) }}>
              <div
                style={{
                  position: 'absolute',
                  insetInlineStart: winW / 2 - W / 2,
                  insetBlockStart: winH / 2 - H / 2,
                }}
              >
                <PhotoCover v={v} f={f} w={W} h={H} />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      <CaptionAt y={portrait ? 520 : 360}>
        <HeLine fmt={v.fmt} text={copy.outcome.less} f={f} at={s(c.lessHe)} out={collapse - 2} />
      </CaptionAt>
      <CaptionAt y={portrait ? 360 : 300}>
        <HeLine fmt={v.fmt} text={copy.outcome.more} f={f} at={s(c.moreHe)} out={people - 6} />
      </CaptionAt>
      <AbsoluteFill
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.72) 100%)',
          opacity: open * (1 - tw(f, process - 24, process - 12)),
        }}
      />
      <CaptionAt y={portrait ? 400 : 330}>
        <Campaign
          lines={portrait ? ['BUILT FOR', 'PEOPLE.'] : [copy.outcome.en]}
          f={f}
          at={people + 10}
          out={process - 26}
          size={portrait ? 104 : 84}
        />
      </CaptionAt>
    </AbsoluteFill>
  )
}
