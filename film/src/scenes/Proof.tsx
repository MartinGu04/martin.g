/**
 * 04 REAL WORK. Proof, compressed to what proves something: the system from the previous
 * scene is real, and it works. One drag moves one shift; the change propagates through the
 * schedule, to the card, to the phone. Then the camera pulls back from it into the wall of
 * everything MARTIN.G builds (Wall.tsx). No product names, no explanation.
 */
import { AbsoluteFill } from 'remotion'
import { world } from '../config/palette'
import { s } from '../config/timeline'
import { Stage } from '../lib/camera'
import { drift, ease, keys, tw } from '../lib/anim'
import { chainAt, ProductWorld } from './Product'
import { cellInTile, productLayout } from './productLayout'
import { systemRect } from './Capabilities'
import { Wall } from './Wall'
import type { SceneProps } from './types'

export function Proof({ v, f }: SceneProps) {
  const c = v.cues
  const portrait = v.fmt === 'portrait'
  const pullBack = s(c.pullBack)
  if (f >= pullBack) return <Wall v={v} f={f} />

  const l = productLayout(v.fmt)
  const proof = s(c.proof)
  const grab = s(c.grab)
  const drop = s(c.drop)
  const resolve = s(c.resolve)
  const st = chainAt(f, { grab, drop, resolve })
  const from = cellInTile(l, l.move.from[0], l.move.from[1])
  const to = cellInTile(l, l.move.to[0], l.move.to[1])

  // Start exactly where the capabilities scene left the system.
  const P = 1613
  const R = systemRect(v.fmt)
  const k0 = R.w / l.sched.w
  const z0 = P / k0 - P
  const x0 = l.sched.x - R.x / k0
  const y0 = l.sched.y - R.y / k0
  const cam = {
    x: keys(f, [
      [proof, x0],
      [grab, (from.x + to.x) / 2, ease.inOut],
      [drop, to.x, ease.inOut],
      [resolve, portrait ? 0 : 60, ease.inOut],
      [pullBack, 0, ease.inOut],
    ]),
    y: keys(f, [
      [proof, y0],
      [grab, (from.y + to.y) / 2, ease.inOut],
      [drop, to.y, ease.inOut],
      [resolve, portrait ? 40 : 20, ease.inOut],
      [pullBack, 0, ease.inOut],
    ]),
    z: keys(f, [
      [proof, z0],
      [grab, z0 - (portrait ? 160 : 140), ease.inOut],
      [drop, z0 - (portrait ? 200 : 170), ease.inOut],
      [resolve, portrait ? 130 : 140, ease.inOut],
      [pullBack, portrait ? 150 : 160, ease.linear],
    ]),
  }
  cam.x += drift(f, 11, 3)
  cam.y += drift(f, 12, 2)

  const enter = { x: from.x + (portrait ? 220 : 300), y: from.y + (portrait ? 260 : 200) }
  const cursor = {
    x: keys(f, [
      [proof, enter.x],
      [grab - 2, from.x, ease.inOut],
      [drop - 1, to.x, ease.inOut],
      [drop + 10, to.x + 140, ease.inOut],
    ]),
    y: keys(f, [
      [proof, enter.y],
      [grab - 2, from.y, ease.inOut],
      [drop - 1, to.y, ease.inOut],
      [drop + 10, to.y + 100, ease.inOut],
    ]),
    pressed: tw(f, grab - 2, grab, ease.out) * (1 - tw(f, drop - 1, drop + 1)),
    o: tw(f, proof + 2, proof + 6) * (1 - tw(f, drop + 6, drop + 12)),
  }
  // Everything around the schedule arrives as the change reaches it.
  const aux = tw(f, drop, resolve - 4, ease.inOut)
  return (
    <AbsoluteFill style={{ background: world.miMaMo.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 60% at 60% 25%, rgba(127,166,214,0.14), rgba(127,166,214,0) 70%)`,
        }}
      />
      <Stage cam={cam}>
        <ProductWorld l={l} st={st} f={f} explode={0} cursor={cursor} aux={aux} />
      </Stage>
    </AbsoluteFill>
  )
}
