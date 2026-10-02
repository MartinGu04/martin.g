/**
 * Timing and easing helpers. Everything is a pure function of the frame, so any frame can
 * be rendered on its own, in any order, by any worker (no state carried between frames).
 */
import { Easing } from 'remotion'

export type Ease = (t: number) => number

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
export const mix = (a: number, b: number, t: number) => a + (b - a) * t

export const ease = {
  linear: (t: number) => t,
  out: Easing.bezier(0.16, 1, 0.3, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  /** Scene-scale camera moves: slow start, long settle. */
  scene: Easing.bezier(0.76, 0, 0.24, 1),
  /** Masks: decisive, no overshoot (matches --ease-mask on the site). */
  mask: Easing.bezier(0.77, 0, 0.18, 1),
  /** A push that accelerates into a cut. */
  rush: Easing.bezier(0.55, 0, 1, 0.45),
  /** Violent acceleration, smooth arrival. */
  arrive: Easing.bezier(0.62, 0, 0.1, 1),
  /** Snap: almost instant arrival, soft landing. */
  snap: Easing.bezier(0.2, 0.9, 0.1, 1),
  expoOut: (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  expoIn: (t: number) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
} satisfies Record<string, Ease>

/** Progress of `f` between frames a and b, clamped and eased. */
export function tw(f: number, a: number, b: number, e: Ease = ease.out) {
  if (b <= a) return f >= a ? 1 : 0
  return e(clamp((f - a) / (b - a)))
}

/** Keyframes: [frame, value, easing into this key]. Holds before the first and after the last. */
export type Key = readonly [number, number, Ease?]
export function keys(f: number, ks: readonly Key[]): number {
  const first = ks[0]
  if (!first) return 0
  if (f <= first[0]) return first[1]
  for (let i = 1; i < ks.length; i++) {
    const a = ks[i - 1]!
    const b = ks[i]!
    if (f <= b[0]) return mix(a[1], b[1], tw(f, a[0], b[0], b[2] ?? ease.inOut))
  }
  return ks[ks.length - 1]![1]
}

/** Deterministic pseudo random generator (mulberry32). */
export function rng(seed: number) {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Smooth deterministic drift: a few incommensurate sines (camera breath, handheld). */
export function drift(f: number, seed: number, amp = 1, speed = 1) {
  const t = f * speed * 0.05
  return (
    amp *
    (Math.sin(t * 1.0 + seed * 1.7) * 0.55 +
      Math.sin(t * 2.31 + seed * 3.1) * 0.3 +
      Math.sin(t * 4.17 + seed * 0.7) * 0.15)
  )
}

/** A short decaying kick (camera jolt on an impact). */
export function jolt(f: number, at: number, amp: number, frames = 10) {
  if (f < at || f > at + frames) return 0
  const t = (f - at) / frames
  return amp * Math.exp(-5 * t) * Math.cos(t * Math.PI * 3)
}

/** 0 → 1 → 0 window with eased edges. */
export function win(f: number, a: number, b: number, fadeIn: number, fadeOut = fadeIn) {
  return tw(f, a, a + fadeIn, ease.inOut) * (1 - tw(f, b - fadeOut, b, ease.inOut))
}
