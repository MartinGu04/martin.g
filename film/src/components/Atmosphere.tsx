import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { assets } from '../config/assets'
import { Preload } from './media'

/** Film grain: four tiles cycled and offset per frame, as light texture over everything. */
export function Grain({ opacity = 0.07 }: { opacity?: number }) {
  const f = useCurrentFrame()
  const tile = assets.grain[f % 4]!
  const ox = (f * 73) % 256
  const oy = (f * 151) % 256
  return (
    <>
      <Preload srcs={assets.grain} />
      <AbsoluteFill
        style={{
          backgroundImage: `url(${tile})`,
          backgroundSize: '256px 256px',
          backgroundPosition: `${ox}px ${oy}px`,
          opacity,
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
        }}
      />
    </>
  )
}

/** The vignette: light falls off into shade at the edges of the frame. */
export function Vignette({ strength = 0.7 }: { strength?: number }) {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 75% 70% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,${strength}) 100%)`,
        pointerEvents: 'none',
      }}
    />
  )
}

/** One warm key light, a pool falling off into black (gradients only ever as light). */
export function KeyLight({
  x = 50,
  y = 40,
  size = 60,
  color = '255,244,230',
  strength = 0.1,
}: {
  x?: number
  y?: number
  size?: number
  color?: string
  strength?: number
}) {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse ${size}% ${size * 0.9}% at ${x}% ${y}%, rgba(${color},${strength}) 0%, rgba(${color},0) 70%)`,
        pointerEvents: 'none',
      }}
    />
  )
}
