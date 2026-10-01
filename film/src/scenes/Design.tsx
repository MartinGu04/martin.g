/**
 * 07 DESIGN IS PART OF THE PRODUCT (ON). The finished document's grid comes towards the
 * camera; its cells turn into crops of the ON work, warm and photographic, and the world
 * changes from gunmetal to bordeaux. The center cell opens into the live site. The camera
 * reads the headline in macro, right to left as Hebrew reads; the page answers the frame
 * (desktop becomes mobile, or the reverse on a phone); then the cream story page, its
 * numbers and its arch. Same grammar, a different world.
 */
import { AbsoluteFill } from 'remotion'
import { assets, type Source } from '../config/assets'
import { copy } from '../config/copy'
import { world } from '../config/palette'
import { s } from '../config/timeline'
import { Plane, Stage } from '../lib/camera'
import { clamp, drift, ease, keys, mix, tw } from '../lib/anim'
import { Crop } from '../components/media'
import { Slate } from '../components/Slate'
import type { SceneProps } from './types'

const on = world.on
type Region = readonly [number, number, number, number]

/** What each mosaic cell shows: a region of an approved ON asset. */
const CELLS: { src: Source; r: Region }[] = [
  { src: assets.on.venue, r: [700, 300, 900, 600] },
  { src: assets.on.patisserie, r: [200, 700, 1200, 800] },
  { src: assets.on.story, r: [20, 80, 600, 215] },
  { src: assets.on.home, r: [1000, 190, 290, 210] },
  { src: assets.on.story, r: [15, 420, 478, 330] },
  { src: assets.on.venue, r: [100, 500, 900, 600] },
  { src: assets.on.story, r: [620, 80, 610, 215] },
  { src: assets.on.patisserie, r: [500, 300, 900, 900] },
  { src: assets.on.home, r: [0, 100, 700, 500] },
  { src: assets.on.mobile, r: [0, 0, 390, 300] },
  { src: assets.on.story, r: [840, 560, 400, 260] },
  { src: assets.on.venue, r: [1200, 100, 700, 700] },
]

export function Design({ v, f }: SceneProps) {
  const c = v.cues
  const portrait = v.fmt === 'portrait'
  const W = portrait ? 1080 : 1920
  const H = portrait ? 1920 : 1080
  const start = s(c.design) - 12
  const design = s(c.design)
  const macroType = s(c.macroType)
  const responsive = s(c.responsive)
  const story = s(c.story)
  const end = s(c.process)

  // The mosaic: a grid of cells in the document's proportions, filling from the center.
  const cols = portrait ? 3 : 5
  const rows = portrait ? 5 : 3
  const cw = portrait ? 300 : 340
  const ch = portrait ? 340 : 300
  const gap = 18
  const center = { c: Math.floor(cols / 2), r: Math.floor(rows / 2) }
  const warm = tw(f, start + 4, design + 8, ease.inOut)

  // The site (desktop on 16:9, mobile on 9:16), opening from the center cell.
  const site = portrait ? assets.on.mobile : assets.on.home
  const siteW = portrait ? 900 : 1600
  const siteH = (siteW * site.h) / site.w
  const open = tw(f, design + 2, design + 18, ease.scene)
  const cellToSite = { w: mix(cw, siteW, open), h: mix(ch, siteH, open) }

  // Macro on the headline: the camera reads right to left.
  const head = portrait ? { x0: 0.82, x1: 0.42, y: 0.58 } : { x0: 0.72, x1: 0.34, y: 0.54 }
  const readT = tw(f, macroType, responsive, ease.inOut)
  const macroZ = portrait ? -900 : -1050
  const toStory = tw(f, story - 6, story + 10, ease.scene)

  const cam = {
    x: keys(f, [
      [start, 0],
      [macroType - 4, 0],
      [macroType + 6, (head.x0 - 0.5) * siteW, ease.inOut],
      [responsive - 2, (head.x1 - 0.5) * siteW, ease.linear],
      [responsive + 10, 0, ease.inOut],
    ]),
    y: keys(f, [
      [start, 0],
      [macroType - 4, 0],
      [macroType + 6, (head.y - 0.5) * siteH, ease.inOut],
      [responsive + 10, 0, ease.inOut],
    ]),
    z: keys(f, [
      [start, -600],
      [design, 380, ease.out],
      [design + 18, portrait ? 200 : 140, ease.inOut],
      [macroType - 4, portrait ? 120 : 60, ease.linear],
      [macroType + 6, macroZ, ease.inOut],
      [responsive - 2, macroZ - 80, ease.linear],
      [responsive + 10, portrait ? 160 : 120, ease.inOut],
      [story, portrait ? 180 : 140, ease.linear],
      [end, portrait ? -120 : -140, ease.inOut],
    ]),
    ry: keys(f, [
      [start, 0],
      [design + 18, 0],
      [macroType - 4, portrait ? -4 : -8, ease.inOut],
      [macroType + 6, portrait ? 8 : 12, ease.inOut],
      [responsive - 2, portrait ? 4 : 6, ease.linear],
      [responsive + 10, 0, ease.inOut],
    ]),
    rx: keys(f, [
      [macroType, 0],
      [macroType + 6, -6, ease.inOut],
      [responsive + 10, 0, ease.inOut],
    ]),
    dof: 7 * tw(f, macroType, macroType + 8) * (1 - tw(f, responsive - 4, responsive + 6)),
    focusZ: 0,
  }
  cam.x += drift(f, 41, 5)
  cam.y += drift(f, 42, 4)

  // Responsive: the page answers the other frame. Desktop narrows into the mobile page on
  // 16:9; on 9:16 the mobile page widens into the desktop one.
  const resp = tw(f, responsive + 4, responsive + 18, ease.scene)
  const other = portrait ? assets.on.home : assets.on.mobile
  const otherW = portrait ? 1000 : 520
  const otherH = (otherW * other.h) / other.w
  const frameW = mix(siteW, otherW, resp)
  const frameH = mix(siteH, otherH, resp)

  const bg = toStory > 0.5 ? on.cream : on.night
  return (
    <AbsoluteFill style={{ background: bg }}>
      <AbsoluteFill style={{ background: world.defense.bg, opacity: 1 - warm }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 60% at 60% 35%, rgba(255,226,196,${0.12 * warm}), rgba(255,226,196,0) 70%)`,
        }}
      />
      <Stage cam={cam}>
        {/* the mosaic */}
        {toStory < 1
          ? Array.from({ length: cols * rows }, (_, i) => {
              const cc = i % cols
              const rr = Math.floor(i / cols)
              const isCenter = cc === center.c && rr === center.r
              const dist = Math.hypot(cc - center.c, rr - center.r)
              const fill = tw(f, start + 2 + dist * 3, start + 10 + dist * 3, ease.mask)
              const away = tw(f, design + 4 + dist * 2, design + 16 + dist * 2, ease.in)
              const x = (cc - center.c) * (cw + gap)
              const y = (rr - center.r) * (ch + gap)
              if (isCenter) return null
              const cell = CELLS[i % CELLS.length]!
              return (
                <Plane
                  key={i}
                  x={x * (1 + away * 0.6)}
                  y={y * (1 + away * 0.6)}
                  z={-away * 900}
                  w={cw}
                  h={ch}
                  opacity={1 - away}
                >
                  <div
                    style={{
                      width: cw,
                      height: ch,
                      border: `1.5px solid rgba(236,239,242,${0.4 * (1 - fill)})`,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        clipPath: `inset(${(1 - fill) * 100}% 0 0 0)`,
                      }}
                    >
                      <Crop
                        src={cell.src}
                        region={coverRegion(cell.src, cell.r, cw, ch)}
                        width={cw}
                      />
                    </div>
                  </div>
                </Plane>
              )
            })
          : null}
        {/* the site, from the center cell */}
        {toStory < 1 ? (
          <Plane w={frameW} h={resp > 0 ? frameH : cellToSite.h} z={0} opacity={1 - toStory}>
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                boxShadow: '0 50px 120px rgba(0,0,0,0.55)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  insetInlineStart: '50%',
                  insetBlockStart: '50%',
                  transform: 'translate(-50%, -50%)',
                  opacity: 1 - resp,
                }}
              >
                <Crop
                  src={site}
                  region={open < 1 ? siteRegion(site, cellToSite.w, cellToSite.h) : undefined}
                  width={open < 1 ? cellToSite.w : siteW}
                />
              </div>
              {resp > 0 ? (
                <div
                  style={{
                    position: 'absolute',
                    insetInlineStart: '50%',
                    insetBlockStart: '50%',
                    transform: 'translate(-50%, -50%)',
                    opacity: resp,
                    width: otherW,
                  }}
                >
                  <Crop src={other} width={otherW} />
                </div>
              ) : null}
            </div>
          </Plane>
        ) : null}
        {/* the story page: cream, numbers, the arch, and the photograph inside it in depth */}
        {toStory > 0 ? (
          <StoryPage portrait={portrait} f={f} story={story} end={end} o={toStory} />
        ) : null}
      </Stage>
      <Slate
        fmt={v.fmt}
        f={f}
        at={design + 10}
        until={responsive}
        index={copy.slates.on[0]}
        name={copy.slates.on[1]}
        tone={on.cream}
      />
    </AbsoluteFill>
  )
}

/** A center crop of region r to the aspect w:h. */
function coverRegion(src: Source, r: Region, w: number, h: number): Region {
  const a = w / h
  let [x, y, rw, rh] = r
  if (rw / rh > a) {
    const nw = rh * a
    x += (rw - nw) / 2
    rw = nw
  } else {
    const nh = rw / a
    y += (rh - nh) / 2
    rh = nh
  }
  return [clamp(x, 0, src.w), clamp(y, 0, src.h), rw, rh]
}

/** While the cell opens, the site is seen through it: a centered crop of the right size. */
function siteRegion(src: Source, w: number, h: number): Region {
  const k = Math.max(w / src.w, h / src.h, 0.0001)
  const scale = Math.max(1, 1 / k) // never upscale the window
  const rw = Math.min(src.w, w * scale)
  const rh = Math.min(src.h, h * scale)
  return [(src.w - rw) / 2, (src.h - rh) / 2, rw, rh]
}

function StoryPage({
  portrait,
  f,
  story,
  end,
  o,
}: {
  portrait: boolean
  f: number
  story: number
  end: number
  o: number
}) {
  const src = assets.on.story
  const t = tw(f, story, end, ease.linear)
  if (portrait) {
    // On the phone: the numbers, then the arch photograph, stacked and readable.
    return (
      <>
        <Plane y={-420 + t * 40} z={0} w={1000} h={(1000 * 215) / 1210} opacity={o}>
          <Crop src={src} region={[20, 80, 1210, 215]} width={1000} />
        </Plane>
        <Plane y={330 - t * 60} z={-120} w={720} h={(720 * 596) / 478} opacity={o}>
          <Crop src={src} region={[15, 400, 478, 596]} width={720} />
        </Plane>
      </>
    )
  }
  return (
    <>
      <Plane x={-40} y={0} z={0} w={1500} h={(1500 * src.h) / src.w} opacity={o}>
        <Crop src={src} width={1500} />
      </Plane>
      {/* the arch, lifted off the page */}
      <Plane
        x={-40 - 750 + (15 + 239) * (1500 / 1245)}
        y={(400 + 298) * (1500 / 1245) - (1500 * src.h) / src.w / 2}
        z={90 + t * 60}
        w={(478 * 1500) / 1245}
        h={(596 * 1500) / 1245}
        opacity={o}
      >
        <Crop
          src={src}
          region={[15, 400, 478, 596]}
          width={(478 * 1500) / 1245}
          style={{ boxShadow: '0 40px 80px rgba(61,26,30,0.25)' }}
        />
      </Plane>
    </>
  )
}
