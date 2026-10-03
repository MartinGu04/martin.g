#!/usr/bin/env node
/**
 * Review stills: renders chosen frames of a composition into out/stills, for quick
 * director's passes without a full render.
 *   node scripts/stills.mjs Desktop 0 12 24 36      frames
 *   node scripts/stills.mjs Mobile 3.5s 7s           seconds
 */
import { bundle } from '@remotion/bundler'
import { renderStill, selectComposition } from '@remotion/renderer'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const film = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const [id = 'Desktop', ...args] = process.argv.slice(2)
const scale = Number(process.env.STILL_SCALE ?? 0.5)
const serveUrl = await bundle({
  entryPoint: path.join(film, 'src/index.ts'),
  publicDir: path.join(film, 'public'),
})
const browserExecutable = process.env.FILM_BROWSER || null
const composition = await selectComposition({ serveUrl, id, browserExecutable })
const out = path.join(film, 'out/stills')
mkdirSync(out, { recursive: true })
for (const a of args) {
  const frame = a.endsWith('s') ? Math.round(parseFloat(a) * composition.fps) : Number(a)
  const output = path.join(out, `${id}-${String(frame).padStart(4, '0')}.png`)
  await renderStill({ serveUrl, composition, frame, output, scale, browserExecutable })
  console.log(output)
}
