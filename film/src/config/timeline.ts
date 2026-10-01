/**
 * The film's single clock. Picture and sound read the same cue table, so a change here moves
 * the cut and its sound together (scripts/export-cues.ts hands it to the audio build).
 *
 * The music runs at 120 BPM: one beat is 12 frames at 24 fps, one bar is 2 seconds. Major
 * cuts sit on beats; motion starts before a hit and resolves on it.
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
  'signal',
  'clarity',
  'product',
  'wall',
  'defense',
  'design',
  'build',
  'converge',
  'signature',
] as const
export type SceneId = (typeof SCENES)[number]

/**
 * Cue points in seconds. Names describe what happens on screen; the audio score
 * (sfx() below) puts a sound on most of them, and nothing on some, on purpose.
 */
export interface Cues {
  pulse: number
  arrive: number
  build: number
  hush: number
  impact: number
  push: number
  // complexity to clarity
  groove: number
  problem: number
  snap: number
  lock: number
  enterCard: number
  // product
  macro: number
  rack: number
  covered: number
  toWall: number
  // chain reaction
  cursor: number
  grab: number
  drop: number
  chain: number
  resolve: number
  // the wall
  pullBack: number
  realWork: number
  dive: number
  // defense systems
  systemA: number
  stateChange: number
  systemB: number
  structure: number
  // design
  design: number
  macroType: number
  responsive: number
  story: number
  // build
  process: number
  launch: number
  // convergence
  travel: number
  align: number
  formed: number
  silence: number
  // signature
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
  /** Scene spans in seconds [from, to]; overlaps are where one shot hands over to the next. */
  scenes: Record<SceneId, readonly [number, number]>
}

const desktopCues: Cues = {
  pulse: 0.125,
  arrive: 1.5,
  build: 1.5,
  hush: 2.75,
  impact: 3.0,
  push: 3.75,
  groove: 4.0,
  problem: 5.0,
  snap: 7.0,
  lock: 8.0,
  enterCard: 9.5,
  macro: 10.0,
  rack: 11.0,
  covered: 12.5,
  toWall: 13.0,
  cursor: 14.0,
  grab: 14.5,
  drop: 15.0,
  chain: 15.0,
  resolve: 16.0,
  pullBack: 16.5,
  realWork: 18.0,
  dive: 19.25,
  systemA: 20.0,
  stateChange: 21.0,
  systemB: 22.0,
  structure: 22.5,
  design: 24.0,
  macroType: 25.5,
  responsive: 27.0,
  story: 28.0,
  process: 30.0,
  launch: 33.0,
  travel: 33.0,
  align: 35.0,
  formed: 36.0,
  silence: 36.5,
  symbol: 36.75,
  wordmark: 37.5,
  line: 38.25,
  black: 40.0,
  end: 42.0,
}

/** Vertical: a harder hook, the same story about six seconds tighter. */
const mobileCues: Cues = {
  pulse: 0.04,
  arrive: 1.0,
  build: 1.0,
  hush: 1.75,
  impact: 2.0,
  push: 2.5,
  groove: 3.0,
  problem: 3.5,
  snap: 5.0,
  lock: 6.0,
  enterCard: 7.0,
  macro: 7.5,
  rack: 8.25,
  covered: 9.5,
  toWall: 10.5,
  cursor: 11.0,
  grab: 11.25,
  drop: 11.75,
  chain: 11.75,
  resolve: 12.75,
  pullBack: 13.25,
  realWork: 14.5,
  dive: 15.5,
  systemA: 16.0,
  stateChange: 17.0,
  systemB: 17.75,
  structure: 18.25,
  design: 19.5,
  macroType: 20.75,
  responsive: 22.0,
  story: 23.0,
  process: 24.0,
  launch: 27.0,
  travel: 27.0,
  align: 28.75,
  formed: 29.75,
  silence: 30.25,
  symbol: 30.5,
  wordmark: 31.25,
  line: 32.0,
  black: 34.0,
  end: 36.0,
}

function spans(c: Cues): Version['scenes'] {
  return {
    signal: [0, c.push + 0.75],
    clarity: [c.push, c.macro],
    product: [c.macro, c.pullBack],
    wall: [c.pullBack, c.systemA],
    defense: [c.systemA, c.design + 0.5],
    design: [c.design - 0.5, c.process + 0.25],
    build: [c.process - 0.25, c.travel + 0.5],
    converge: [c.launch - 0.25, c.symbol + 0.25],
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
/* Sound score: what sounds, where. Kinds are synthesized in audio/build.py.                   */
/* ------------------------------------------------------------------------------------------ */

export type SfxKind =
  | 'pulse' // the opening signal: a precise transient over sub
  | 'passby' // air displacement as a plane passes the lens
  | 'tick' // a tiny UI tick
  | 'snap' // a soft mechanical snap
  | 'lock' // grid lock: snap plus low body
  | 'riser' // reversed air swelling into a hit
  | 'impactA' // the MARTIN.G signature (opening; the finale references it)
  | 'impactB' // a smaller cinematic hit
  | 'whoosh' // layered transition sweep
  | 'confirm' // UI confirmation
  | 'tap' // a touch
  | 'signal' // electrical pulse travelling a path
  | 'ping' // cold state change
  | 'sweep' // deep transition sweep
  | 'final' // the last signature: deep, clean, references impactA

export interface Sfx {
  at: number // seconds
  kind: SfxKind
  gain?: number // dB
  pan?: number // -1 .. 1
  pitch?: number // semitones
  dur?: number // seconds (risers, sweeps)
}

export function sfx(v: Version): Sfx[] {
  const c = v.cues
  const out: Sfx[] = [
    { at: c.pulse, kind: 'pulse' },
    { at: c.pulse + 0.35, kind: 'passby', pan: -0.6, gain: -9 },
    { at: c.pulse + 0.7, kind: 'passby', pan: 0.7, gain: -7 },
    { at: c.arrive - 0.2, kind: 'passby', pan: -0.2, gain: -5 },
    { at: c.arrive, kind: 'snap', gain: -10 },
    ...[0, 0.25, 0.5, 0.75].map((d, i) => ({
      at: c.build + 0.25 + d * 0.9,
      kind: 'tick' as const,
      pan: i % 2 ? 0.4 : -0.4,
      pitch: i * 2,
      gain: -16,
    })),
    { at: c.hush - 0.85, kind: 'riser', dur: 0.85, gain: -6 },
    { at: c.impact, kind: 'impactA' },
    { at: c.push, kind: 'whoosh', dur: 0.75, gain: -6 },
    // complexity to clarity: four snaps on the eighths, then the lock
    ...[0, 0.25, 0.5, 0.75].map((d, i) => ({
      at: c.snap + d * (c.lock - c.snap),
      kind: 'snap' as const,
      pan: [-0.5, 0.5, -0.25, 0.25][i],
      pitch: i,
      gain: -8,
    })),
    { at: c.lock, kind: 'lock' },
    { at: c.enterCard, kind: 'whoosh', dur: 0.5, gain: -10 },
    // product
    { at: c.covered, kind: 'confirm', gain: -10 },
    { at: c.toWall, kind: 'sweep', dur: 1.0, gain: -9 },
    // chain reaction: the interaction is percussion
    { at: c.grab, kind: 'tap', gain: -6 },
    { at: c.drop, kind: 'snap', gain: -6 },
    ...[0.25, 0.5, 0.75].map((d, i) => ({
      at: c.chain + d * (c.resolve - c.chain),
      kind: 'tick' as const,
      pitch: 3 + i * 4,
      pan: [-0.6, 0.6, 0][i],
      gain: -9,
    })),
    { at: c.resolve, kind: 'confirm', gain: -6 },
    // the wall
    { at: c.pullBack, kind: 'sweep', dur: 1.4, gain: -5 },
    { at: c.realWork - 0.5, kind: 'riser', dur: 0.5, gain: -10 },
    { at: c.realWork, kind: 'impactB' },
    { at: c.dive, kind: 'whoosh', dur: 0.75, gain: -7 },
    // defense systems
    { at: c.systemA + 0.25, kind: 'signal', pan: -0.5, gain: -12 },
    { at: c.systemA + 0.75, kind: 'signal', pan: 0.5, gain: -12 },
    { at: c.stateChange, kind: 'ping', gain: -8 },
    { at: c.systemB, kind: 'whoosh', dur: 0.4, gain: -14 },
    ...[0, 0.25, 0.5].map((d, i) => ({
      at: c.structure + d,
      kind: 'snap' as const,
      pitch: -2 + i,
      pan: [-0.3, 0.3, 0][i],
      gain: -9,
    })),
    // design
    { at: c.design - 0.5, kind: 'sweep', dur: 0.75, gain: -10 },
    { at: c.responsive, kind: 'tick', gain: -12 },
    // build: each word lands, the product launches
    ...[0, 1, 2, 3].map((i) => ({
      at: c.process + i * ((c.launch - c.process) / 4),
      kind: 'lock' as const,
      gain: -9 - (3 - i),
      pitch: i,
    })),
    { at: c.launch - 0.5, kind: 'riser', dur: 0.5, gain: -8 },
    { at: c.launch, kind: 'impactB' },
    // convergence
    ...[0.5, 1.0, 1.4, 1.75].map((d, i) => ({
      at: c.travel + d,
      kind: 'passby' as const,
      pan: [-0.8, 0.8, -0.5, 0.5][i],
      gain: -6,
    })),
    { at: c.align, kind: 'sweep', dur: 1.0, gain: -8 },
    { at: c.formed - 1.0, kind: 'riser', dur: 1.0 + (c.silence - c.formed), gain: -4 },
    { at: c.formed, kind: 'lock', gain: -6 },
    // signature: silence, then the opening's signature returns, then the last word
    { at: c.symbol, kind: 'impactA', gain: 1 },
    { at: c.wordmark, kind: 'whoosh', dur: 0.6, gain: -16 },
    { at: c.line, kind: 'tick', gain: -14, pitch: -5 },
    { at: c.black, kind: 'final' },
  ]
  return out.sort((a, b) => a.at - b.at)
}
