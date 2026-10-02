/**
 * The film's single clock (second pass). Picture and sound read the same cue table, so a
 * change here moves the cut and its sound together (scripts/export-cues.ts hands it to the
 * audio build).
 *
 * The story: IDEA → STRUCTURE → WHAT MARTIN.G BUILDS → PROOF → OUTCOME → CRAFT → THE
 * MARTIN.G WORLD → MAKE IT REAL. Projects are proof inside it, never the subject.
 *
 * The music runs at 120 BPM: one beat is 12 frames at 24 fps, one bar is 2 seconds.
 */
export const FPS = 24
export const BPM = 120
export const BEAT = (FPS * 60) / BPM
export const BAR = BEAT * 4

/** Seconds to frames. */
export const s = (sec: number) => Math.round(sec * FPS)

export type Format = 'landscape' | 'portrait'
export type VersionId = 'desktop' | 'mobile'

export const SCENES = [
  'idea',
  'capabilities',
  'proof',
  'outcome',
  'craft',
  'world',
  'signature',
] as const
export type SceneId = (typeof SCENES)[number]

/** Cue points in seconds. */
export interface Cues {
  // 01 an idea
  trace: number
  ideaHe: number
  ideaEn: number
  // 02 from idea to structure
  structure: number
  structHe: number
  structEn: number
  screen: number
  // 03 what MARTIN.G builds (one frame that keeps becoming something else)
  web: number
  product: number
  brand: number
  system: number
  needs: number
  // 04 proof
  proof: number
  grab: number
  drop: number
  resolve: number
  pullBack: number
  realWork: number
  dive: number
  // 05 people and outcome
  clutter: number
  lessHe: number
  collapse: number
  moreHe: number
  people: number
  // 06 design and engineering
  process: number
  live: number
  // 07 the MARTIN.G world
  world: number
  bridgeHe: number
  align: number
  formed: number
  silence: number
  // 08 make it real
  symbol: number
  wordmark: number
  line: number
  black: number
  end: number
}

export interface Version {
  id: VersionId
  fmt: Format
  width: number
  height: number
  cues: Cues
  /** Scene spans in seconds [from, to]; overlaps are handovers. */
  scenes: Record<SceneId, readonly [number, number]>
}

const desktopCues: Cues = {
  trace: 0.5,
  ideaHe: 1.5,
  ideaEn: 2.75,
  structure: 5.0,
  structHe: 6.0,
  structEn: 7.0,
  screen: 9.0,
  web: 10.0,
  product: 12.0,
  brand: 13.5,
  system: 14.5,
  needs: 15.5,
  proof: 17.0,
  grab: 17.5,
  drop: 18.0,
  resolve: 19.0,
  pullBack: 19.5,
  realWork: 21.0,
  dive: 22.5,
  clutter: 24.0,
  lessHe: 24.5,
  collapse: 26.0,
  moreHe: 26.5,
  people: 28.0,
  process: 30.0,
  live: 34.0,
  world: 34.5,
  bridgeHe: 36.0,
  align: 37.5,
  formed: 39.0,
  silence: 39.5,
  symbol: 39.75,
  wordmark: 40.5,
  line: 41.25,
  black: 43.0,
  end: 44.5,
}

/**
 * Vertical: its own edit. A line already moving on the first frame, one idea at a time,
 * larger focal objects, shorter proof, fewer simultaneous elements.
 */
const mobileCues: Cues = {
  trace: 0.0,
  ideaHe: 0.5,
  ideaEn: 1.5,
  structure: 3.0,
  structHe: 3.5,
  structEn: 4.5,
  screen: 5.5,
  web: 6.5,
  product: 8.5,
  brand: 10.0,
  system: 11.0,
  needs: 12.0,
  proof: 13.5,
  grab: 14.0,
  drop: 14.5,
  resolve: 15.5,
  pullBack: 16.0,
  realWork: 17.0,
  dive: 18.5,
  clutter: 19.5,
  lessHe: 20.0,
  collapse: 21.5,
  moreHe: 22.0,
  people: 23.0,
  process: 25.0,
  live: 28.0,
  world: 28.25,
  bridgeHe: 28.75,
  align: 30.0,
  formed: 31.0,
  silence: 31.25,
  symbol: 31.5,
  wordmark: 32.0,
  line: 32.5,
  black: 34.0,
  end: 35.0,
}

function spans(c: Cues): Version['scenes'] {
  return {
    idea: [0, c.web],
    capabilities: [c.screen, c.proof],
    proof: [c.proof, c.clutter],
    outcome: [c.dive, c.process],
    craft: [c.process - 0.5, c.world + 0.5],
    world: [c.live, c.symbol + 0.25],
    signature: [c.silence, c.end],
  }
}

export const versions: Record<VersionId, Version> = {
  desktop: {
    id: 'desktop',
    fmt: 'landscape',
    width: 1920,
    height: 1080,
    cues: desktopCues,
    scenes: spans(desktopCues),
  },
  mobile: {
    id: 'mobile',
    fmt: 'portrait',
    width: 1080,
    height: 1920,
    cues: mobileCues,
    scenes: spans(mobileCues),
  },
}

/** Frames of a cue. */
export const cf = (v: Version, cue: keyof Cues) => s(v.cues[cue])

/* ------------------------------------------------------------------------------------------ */
/* Sound score. Fewer, quieter transition sounds than the first pass: the music carries the    */
/* cuts, interface sounds are percussion, and silence is used twice, on purpose.               */
/* ------------------------------------------------------------------------------------------ */

export type SfxKind =
  | 'bloom' // a soft sub swell with air: something beginning (no transient)
  | 'trace' // a filtered, moving tone that follows the line of light
  | 'tick' // a tiny UI tick, pitched (used as percussion)
  | 'snap' // a soft mechanical snap
  | 'lock' // grid lock: snap plus low body
  | 'riser' // reversed air swelling into a hit
  | 'impact' // a cinematic hit, warm, no bell
  | 'air' // a long, low, quiet air movement under a camera move
  | 'tap' // a touch
  | 'signal' // electrical pulse travelling a path
  | 'sweep' // deep transition sweep
  | 'chord' // the brand chord: the MG signature (opening idea and finale)
  | 'final' // the last signature: deep, clean, resolves the brand chord

export interface Sfx {
  at: number
  kind: SfxKind
  gain?: number
  pan?: number
  pitch?: number
  dur?: number
}

export function sfx(v: Version): Sfx[] {
  const c = v.cues
  const procStep = (c.live - c.process) / 4
  const out: Sfx[] = [
    // an idea: a bloom, then a moving tone that follows the line; no alarm, no transient
    { at: Math.max(0, c.trace - 0.25), kind: 'bloom', dur: 3.5, gain: -9 },
    { at: c.trace, kind: 'trace', dur: c.structure - c.trace, gain: -15 },
    { at: c.ideaHe, kind: 'tick', gain: -24, pitch: -7 },
    // structure: the grid locks, gently
    { at: c.structure, kind: 'air', dur: 2.5, gain: -14 },
    ...[0, 0.5, 1.0, 1.5].map((d, i) => ({
      at: c.structure + 1.0 + d,
      kind: 'tick' as const,
      pitch: i * 2,
      pan: i % 2 ? 0.4 : -0.4,
      gain: -20,
    })),
    { at: c.screen, kind: 'lock', gain: -10 },
    // what MARTIN.G builds: each change of the frame is a soft snap on the beat
    { at: c.product, kind: 'snap', gain: -12, pan: -0.2 },
    { at: c.brand, kind: 'snap', gain: -12, pan: 0.2, pitch: 2 },
    { at: c.system, kind: 'snap', gain: -11, pitch: 4 },
    { at: c.needs, kind: 'lock', gain: -12 },
    // proof: the interaction is percussion
    { at: c.grab, kind: 'tap', gain: -8 },
    { at: c.drop, kind: 'snap', gain: -8 },
    ...[0.25, 0.5, 0.75].map((d, i) => ({
      at: c.drop + d * (c.resolve - c.drop),
      kind: 'tick' as const,
      pitch: 3 + i * 4,
      pan: [-0.5, 0.5, 0][i],
      gain: -12,
    })),
    { at: c.pullBack, kind: 'air', dur: 1.6, gain: -9 },
    { at: c.realWork - 0.5, kind: 'riser', dur: 0.5, gain: -12 },
    { at: c.realWork, kind: 'impact', gain: -3 },
    { at: c.realWork + 0.6, kind: 'signal', pan: 0.6, gain: -18 },
    { at: c.dive, kind: 'air', dur: 1.4, gain: -10 },
    // outcome: the clutter resolves on a lock; then air opens onto the real world
    { at: c.collapse, kind: 'lock', gain: -9 },
    { at: c.people - 0.5, kind: 'air', dur: 2.0, gain: -12 },
    // craft: each word causes its change
    ...[0, 1, 2, 3].map((i) => ({
      at: c.process + i * procStep,
      kind: 'lock' as const,
      gain: -10 - (3 - i),
      pitch: i,
    })),
    { at: c.live - 0.5, kind: 'riser', dur: 0.5, gain: -10 },
    { at: c.live, kind: 'impact', gain: -4 },
    // the world: one continuous move; the align is felt, not announced
    { at: c.align, kind: 'sweep', dur: c.formed - c.align, gain: -12 },
    { at: c.formed - 1.0, kind: 'riser', dur: 1.0 + (c.silence - c.formed), gain: -6 },
    { at: c.formed, kind: 'lock', gain: -8 },
    // make it real: silence, the brand chord returns, then the last note
    { at: c.symbol, kind: 'chord', gain: 0 },
    { at: c.black, kind: 'final' },
  ]
  return out.sort((a, b) => a.at - b.at)
}
