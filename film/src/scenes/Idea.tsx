/**
 * 01 AN IDEA → 02 FROM IDEA TO STRUCTURE. Darkness and a slow pulse. One line of light
 * moves like a thought, tracing the outline of the M in the new mark, close and slow, never
 * the whole mark. Its corners leave small nodes behind. Then the line multiplies: grid,
 * frame, wireframe, components, until the frame holds a real website. The camera never
 * leaves the line, so nothing here is a cut.
 */
import { AbsoluteFill } from 'remotion'
import { assets } from '../config/assets'
import { copy } from '../config/copy'
import { brand, world } from '../config/palette'
import { s } from '../config/timeline'
import { M_TRACE, pointAt, polyLength } from '../brand/geometry'
import { drift, ease, mix, tw } from '../lib/anim'
import { Crop } from '../components/media'
import { CaptionAt, EnLine, HeLine } from '../components/Caption'
import { BLOCKS, frameGeom } from './frame'
import type { SceneProps } from './types'

const LEN = polyLength(M_TRACE)

/** The part of a polyline between two distances. */
function sub(pts: readonly (readonly [number, number])[], d0: number, d1: number) {
  const out: [number, number][] = [pointAt(pts, d0)]
  let acc = 0
  for (let i = 1; i < pts.length; i++) {
    acc += Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1])
    if (acc > d0 && acc < d1) out.push([pts[i]![0], pts[i]![1]])
  }
  out.push(pointAt(pts, d1))
  return out
}

export function Idea({ v, f }: SceneProps) {
  const c = v.cues
  const portrait = v.fmt === 'portrait'
  const W = v.width
  const H = v.height
  const F = frameGeom(v.fmt)
  const trace = s(c.trace)
  const structure = s(c.structure)
  const screen = s(c.screen)
  const web = s(c.web)

  // The M outline in screen space.
  const M = M_TRACE.map(([x, y]) => [W / 2 + F.m.x + x * F.m.k, H / 2 + F.m.y + y * F.m.k] as const)
  const mLen = LEN * F.m.k
  const drawn = mix(
    portrait ? 0.06 : 0,
    1,
    tw(f, trace, structure - 4, (t) => ease.inOut(t * 0.85 + 0.15 * t * t)),
  )
  const d = drawn * mLen
  const [hx, hy] = pointAt(M, d)

  // 2D camera: close on the moving point, then opening to the whole outline.
  const open = tw(f, trace + (portrait ? 10 : 30), structure, ease.scene)
  const Z = mix(portrait ? 3.4 : 2.6, 1, open) * (1 + 0.012 * Math.sin(f / 30) * (1 - open))
  const cx = mix(hx, W / 2, open) + drift(f, 1, 6) * (1 - open)
  const cy = mix(hy, H / 2, open) + drift(f, 2, 4) * (1 - open)
  const T = `translate(${W / 2}px, ${H / 2}px) scale(${Z}) translate(${-cx}px, ${-cy}px)`

  // Structure: the frame and its grid grow out of the outline.
  const fx0 = W / 2 + F.web.x - F.web.w / 2
  const fy0 = H / 2 + F.web.y - F.web.h / 2
  const fw = F.web.w
  const fh = F.web.h
  const frameP = tw(f, structure + 6, structure + 30, ease.scene)
  const mFade = 1 - 0.85 * tw(f, structure + 10, screen - 6, ease.inOut)
  const cols = portrait ? 4 : 12
  const gridO = 0.22 * tw(f, structure, structure + 18) * (1 - tw(f, screen, web - 4))
  const src = portrait ? assets.on.mobile : assets.on.home
  const k = fw / src.w
  const blocks = BLOCKS[v.fmt]
  const wire = (i: number) =>
    tw(f, s(c.structHe) + 8 + i * 3, s(c.structHe) + 18 + i * 3, ease.snap)
  const comp = (i: number) => tw(f, screen - 22 + i * 2, screen - 12 + i * 2, ease.out)
  const real = (i: number) => tw(f, screen + i * 1.6, screen + 8 + i * 1.6, ease.mask)
  const whole = tw(f, web - 8, web - 2, ease.inOut)
  const night = tw(f, screen - 4, screen + 8)

  // A warm pool of light follows the thought.
  const light =
    (portrait ? 0.16 : 0.1) * tw(f, trace, trace + (portrait ? 1 : 12)) * (1 - 0.6 * open)

  return (
    <AbsoluteFill style={{ background: brand.black }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle ${portrait ? 720 : 620}px at ${(hx - cx) * Z + W / 2}px ${(hy - cy) * Z + H / 2}px, rgba(255,244,230,${light}), rgba(255,244,230,0) 70%)`,
        }}
      />
      <AbsoluteFill style={{ transform: T, transformOrigin: '0 0' }}>
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {/* construction: each segment of the outline, extended, very faint */}
          {M.slice(1).map(([x1, y1], i) => {
            const [x0, y0] = M[i]!
            const reached =
              d >=
              M.slice(0, i + 1).reduce(
                (acc, p, j) => (j ? acc + Math.hypot(p[0] - M[j - 1]![0], p[1] - M[j - 1]![1]) : 0),
                0,
              )
            if (!reached) return null
            const ux = (x1 - x0) / Math.hypot(x1 - x0, y1 - y0)
            const uy = (y1 - y0) / Math.hypot(x1 - x0, y1 - y0)
            return (
              <line
                key={i}
                x1={x0 - ux * 2400}
                y1={y0 - uy * 2400}
                x2={x1 + ux * 2400}
                y2={y1 + uy * 2400}
                stroke={brand.light}
                strokeOpacity={0.07 * mFade}
                vectorEffect="non-scaling-stroke"
                strokeWidth={1}
              />
            )
          })}
          {/* the line itself */}
          <polyline
            points={sub(M, 0, d)
              .map((p) => p.join(','))
              .join(' ')}
            fill="none"
            stroke={brand.ink}
            strokeOpacity={0.7 * mFade}
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="miter"
          />
          <polyline
            points={sub(M, Math.max(0, d - 160 * F.m.k), d)
              .map((p) => p.join(','))
              .join(' ')}
            fill="none"
            stroke={brand.light}
            strokeOpacity={mFade}
            strokeWidth={3}
            vectorEffect="non-scaling-stroke"
          />
          {/* nodes left at the corners it has turned */}
          {M.map(([x, y], i) => {
            const at =
              i === 0
                ? 0
                : M.slice(0, i + 1).reduce(
                    (acc, p, j) =>
                      j ? acc + Math.hypot(p[0] - M[j - 1]![0], p[1] - M[j - 1]![1]) : 0,
                    0,
                  )
            if (d < at) return null
            const r = 6 / Z
            return (
              <rect
                key={i}
                x={x - r}
                y={y - r}
                width={2 * r}
                height={2 * r}
                fill="none"
                stroke={brand.light}
                strokeOpacity={0.8 * mFade}
                strokeWidth={1.2}
                vectorEffect="non-scaling-stroke"
              />
            )
          })}
          {/* the thought's head */}
          {f < structure + 12 ? (
            <g opacity={1 - tw(f, structure, structure + 12)}>
              <circle cx={hx} cy={hy} r={44 / Z} fill="url(#glow)" />
              <rect
                x={hx - 5 / Z}
                y={hy - 5 / Z}
                width={10 / Z}
                height={10 / Z}
                fill={brand.light}
              />
            </g>
          ) : null}
          <defs>
            <radialGradient id="glow">
              <stop offset="0%" stopColor="rgb(255,244,230)" stopOpacity={0.55} />
              <stop offset="100%" stopColor="rgb(255,244,230)" stopOpacity={0} />
            </radialGradient>
          </defs>
          {/* the grid the frame stands on */}
          {Array.from({ length: cols + 1 }, (_, i) => {
            const x = fx0 + (i * fw) / cols
            const p = tw(f, structure + i * 1.5, structure + 14 + i * 1.5, ease.out)
            return (
              <line
                key={`g${i}`}
                x1={x}
                y1={-200}
                x2={x}
                y2={-200 + (H + 400) * p}
                stroke={brand.light}
                strokeOpacity={gridO}
                vectorEffect="non-scaling-stroke"
                strokeWidth={1}
              />
            )
          })}
          {[fy0, fy0 + fh].map((y, i) => (
            <line
              key={`h${i}`}
              x1={-200}
              y1={y}
              x2={-200 + (W + 400) * tw(f, structure + 4 + i * 3, structure + 20 + i * 3, ease.out)}
              y2={y}
              stroke={brand.light}
              strokeOpacity={gridO}
              vectorEffect="non-scaling-stroke"
              strokeWidth={1}
            />
          ))}
        </svg>
        {/* the frame: drawn from the outline's stems, then filled */}
        {frameP > 0 ? (
          <div
            style={{
              position: 'absolute',
              insetInlineStart: fx0,
              insetBlockStart: fy0,
              width: fw,
              height: fh,
              overflow: 'hidden',
            }}
          >
            <div
              style={{ position: 'absolute', inset: 0, background: world.on.night, opacity: night }}
            />
            <svg
              width={fw}
              height={fh}
              style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
            >
              <rect
                x={0.75}
                y={0.75}
                width={fw - 1.5}
                height={fh - 1.5}
                fill="none"
                stroke={brand.ink}
                strokeOpacity={0.75 * (1 - whole)}
                strokeWidth={1.5}
                strokeDasharray={`${2 * (fw + fh)}`}
                strokeDashoffset={2 * (fw + fh) * (1 - frameP)}
              />
              {blocks.map(([x, y, w, h], i) => {
                const p = wire(i)
                if (p <= 0) return null
                const o = (1 - real(i)) * (1 - whole)
                const X = x * k
                const Y = y * k
                const Wd = w * k * p
                const Hd = h * k
                return (
                  <g key={i} opacity={o}>
                    <rect
                      x={X}
                      y={Y}
                      width={Wd}
                      height={Hd}
                      fill={`rgba(245,243,238,${0.07 * comp(i)})`}
                      stroke={brand.ink}
                      strokeOpacity={0.65}
                      strokeWidth={1.2}
                    />
                    <path
                      d={`M${X} ${Y} L${X + Wd} ${Y + Hd} M${X + Wd} ${Y} L${X} ${Y + Hd}`}
                      stroke={brand.ink}
                      strokeOpacity={0.18 * (1 - comp(i))}
                      strokeWidth={1}
                    />
                    {Hd > 30 * k ? (
                      <rect
                        x={X + Wd * 0.08}
                        y={Y + Hd * 0.35}
                        width={Wd * 0.6 * comp(i)}
                        height={Math.max(4, Hd * 0.14)}
                        fill={brand.ink}
                        opacity={0.35}
                      />
                    ) : null}
                  </g>
                )
              })}
            </svg>
            {blocks.map(([x, y, w], i) => {
              const p = real(i)
              if (p <= 0) return null
              return (
                <div
                  key={`r${i}`}
                  style={{
                    position: 'absolute',
                    insetInlineStart: x * k,
                    insetBlockStart: y * k,
                    clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`,
                  }}
                >
                  <Crop src={src} region={blocks[i]} width={w * k} />
                </div>
              )
            })}
            <div style={{ position: 'absolute', inset: 0, opacity: whole }}>
              <Crop src={src} width={fw} />
            </div>
          </div>
        ) : null}
      </AbsoluteFill>
      {/* words: Hebrew leads, English supports */}
      <CaptionAt y={F.caption.y}>
        <HeLine fmt={v.fmt} text={copy.idea.he} f={f} at={s(c.ideaHe)} out={s(c.structHe) - 10} />
        <EnLine fmt={v.fmt} text={copy.idea.en} f={f} at={s(c.ideaEn)} out={s(c.structHe) - 12} />
      </CaptionAt>
      <CaptionAt y={F.caption.y}>
        <HeLine
          fmt={v.fmt}
          text={copy.structure.he}
          f={f}
          at={s(c.structHe)}
          out={web - 9}
          breakAfter={portrait ? 2 : undefined}
        />
        {portrait ? null : (
          <EnLine fmt={v.fmt} text={copy.structure.en} f={f} at={s(c.structEn)} out={web - 10} />
        )}
      </CaptionAt>
    </AbsoluteFill>
  )
}
