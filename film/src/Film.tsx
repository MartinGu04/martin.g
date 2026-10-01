/**
 * The film: scenes laid on the version's clock, the atmosphere over everything, and the
 * mastered soundtrack. Scenes overlap where one shot hands over to the next; each decides
 * its own handover from the shared cues, so there are no generic transitions here.
 */
import type { ComponentType } from 'react'
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, getStaticFiles } from 'remotion'
import { brand } from './config/palette'
import { s, versions, type SceneId, type VersionId } from './config/timeline'
import { loadFonts } from './lib/fonts'
import { Grain, Vignette } from './components/Atmosphere'
import type { SceneProps } from './scenes/types'
import { Signal } from './scenes/Signal'
import { Clarity } from './scenes/Clarity'
import { Product } from './scenes/Product'
import { Wall } from './scenes/Wall'
import { Defense } from './scenes/Defense'
import { Design } from './scenes/Design'
import { Build } from './scenes/Build'
import { Converge } from './scenes/Converge'
import { Signature } from './scenes/Signature'

loadFonts()

const SCENE: Record<SceneId, ComponentType<SceneProps>> = {
  signal: Signal,
  clarity: Clarity,
  product: Product,
  wall: Wall,
  defense: Defense,
  design: Design,
  build: Build,
  converge: Converge,
  signature: Signature,
}

/** Paint order: later scenes over earlier ones, except where a handover says otherwise. */
const ORDER: SceneId[] = [
  'signal',
  'clarity',
  'product',
  'wall',
  'defense',
  'design',
  'build',
  'converge',
  'signature',
]

export interface FilmProps {
  version: VersionId
  /** Render a single scene (studio work); undefined renders the whole film. */
  only?: SceneId
  muted?: boolean
}

export function Film({ version, only, muted }: FilmProps) {
  const v = versions[version]
  const f = useCurrentFrame()
  const mix = `audio/${version}/mix.wav`
  const hasAudio = getStaticFiles().some((file) => file.name === mix)
  const blackAt = s(v.cues.black)
  return (
    <AbsoluteFill style={{ background: brand.black }}>
      {ORDER.filter((id) => !only || id === only).map((id) => {
        const [a, b] = v.scenes[id]
        if (f < s(a) || f >= s(b)) return null
        const Scene = SCENE[id]
        return (
          <AbsoluteFill key={id}>
            <Scene v={v} f={f} />
          </AbsoluteFill>
        )
      })}
      <Vignette strength={0.55} />
      <Grain opacity={0.085} />
      {f >= blackAt ? <AbsoluteFill style={{ background: '#000' }} /> : null}
      {hasAudio && !muted ? <Audio src={staticFile(mix)} /> : null}
    </AbsoluteFill>
  )
}
