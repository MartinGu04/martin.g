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
import { Idea } from './scenes/Idea'
import { Capabilities } from './scenes/Capabilities'
import { Proof } from './scenes/Proof'
import { Outcome } from './scenes/Outcome'
import { Craft } from './scenes/Craft'
import { World } from './scenes/World'
import { Signature } from './scenes/Signature'

loadFonts()

const SCENE: Record<SceneId, ComponentType<SceneProps>> = {
  idea: Idea,
  capabilities: Capabilities,
  proof: Proof,
  outcome: Outcome,
  craft: Craft,
  world: World,
  signature: Signature,
}

/** Paint order: later scenes over earlier ones. */
const ORDER: SceneId[] = ['idea', 'capabilities', 'proof', 'outcome', 'craft', 'world', 'signature']

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
