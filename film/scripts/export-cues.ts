/**
 * Hands the film's clock to the audio build: for each version, the cue table (seconds), the
 * sound score and the duration, as audio/cues-<version>.json. Run with Node 22.18+ (it
 * strips the types itself): node scripts/export-cues.ts
 */
import { writeFileSync } from 'node:fs'
import { BPM, FPS, sfx, versions } from '../src/config/timeline.ts'

for (const v of Object.values(versions)) {
  const out = { id: v.id, fps: FPS, bpm: BPM, duration: v.cues.end, cues: v.cues, sfx: sfx(v) }
  const file = new URL(`../audio/cues-${v.id}.json`, import.meta.url)
  writeFileSync(file, JSON.stringify(out, null, 2) + '\n')
  console.log(`cues: ${v.id} (${out.sfx.length} sounds, ${out.duration}s)`)
}
