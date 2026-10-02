#!/usr/bin/env node
/**
 * Renders a master: prepares assets, exports the cues, builds the soundtrack, then renders
 * picture and sound together.
 *   node scripts/render.mjs desktop            3840 × 2160 (the 1920 × 1080 design at 2×)
 *   node scripts/render.mjs mobile             1080 × 1920
 *   FILM_SCALE=1 node scripts/render.mjs desktop   a 1920 × 1080 review render
 * FILM_BROWSER points at a local Chromium headless shell when Remotion cannot download one.
 */
import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'
import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const film = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const version = process.argv[2] ?? 'desktop'
const id = version === 'mobile' ? 'Mobile' : 'Desktop'
const scale = Number(process.env.FILM_SCALE ?? (version === 'mobile' ? 1 : 2))
const run = (cmd, args) => execFileSync(cmd, args, { cwd: film, stdio: 'inherit' })

run('node', ['scripts/sync-assets.mjs'])
run('node', ['scripts/export-cues.ts'])
run('python3', ['audio/build.py', version])

const serveUrl = await bundle({
  entryPoint: path.join(film, 'src/index.ts'),
  publicDir: path.join(film, 'public'),
})
const browserExecutable = process.env.FILM_BROWSER || null
const composition = await selectComposition({
  serveUrl,
  id,
  browserExecutable,
  inputProps: { version },
})
const w = composition.width * scale
const h = composition.height * scale
mkdirSync(path.join(film, 'out'), { recursive: true })
const outputLocation = path.join(film, 'out', `MARTIN.G-film-${version}-${w}x${h}.mp4`)
let last = -1
await renderMedia({
  serveUrl,
  composition,
  inputProps: { version },
  codec: 'h264',
  crf: scale > 1 ? 16 : 14,
  x264Preset: 'slow',
  pixelFormat: 'yuv420p',
  colorSpace: 'bt709',
  audioCodec: 'aac',
  audioBitrate: '320k',
  scale,
  imageFormat: 'png',
  concurrency: Number(process.env.FILM_CONCURRENCY ?? 4),
  browserExecutable,
  outputLocation,
  onProgress: ({ progress }) => {
    const p = Math.floor(progress * 20)
    if (p !== last) {
      last = p
      console.log(`${id}: ${Math.round(progress * 100)}%`)
    }
  },
})
console.log(outputLocation)
