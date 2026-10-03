import type { Version } from '../config/timeline'

/** Every scene renders from the absolute frame and the version's cue table. */
export interface SceneProps {
  v: Version
  f: number
}
