#!/usr/bin/env node
/**
 * Prepares film/public from the site's own approved sources, so the film never keeps a
 * second copy of any asset in Git:
 *   brand marks   ../public/brand/provisional (the supplied MARTIN.G symbol and wordmark)
 *   project media ../src/assets/work (sanitized, approved)
 *   fonts         ../src/fonts (Archivo, Noto Sans Hebrew; SIL OFL)
 * It also generates the film grain tiles and samples the symbol into the mosaic cells the
 * finale assembles (src/generated/monogram-cells.json, committed so the code typechecks).
 */
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { decodePng, encodePng } from './png.mjs'

const film = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const site = path.resolve(film, '..')
const pub = path.join(film, 'public')

function copy(from, to) {
  mkdirSync(path.dirname(to), { recursive: true })
  copyFileSync(from, to)
}

copy(
  path.join(site, 'public/brand/provisional/monogram-mask.png'),
  path.join(pub, 'brand/symbol.png'),
)
copy(
  path.join(site, 'public/brand/provisional/wordmark-mask.png'),
  path.join(pub, 'brand/wordmark.png'),
)
for (const project of ['mi-ma-mo', 'on']) {
  const dir = path.join(site, 'src/assets/work', project)
  for (const f of readdirSync(dir)) copy(path.join(dir, f), path.join(pub, 'work', project, f))
}
for (const f of readdirSync(path.join(site, 'src/fonts'))) {
  if (f.endsWith('.woff2')) copy(path.join(site, 'src/fonts', f), path.join(pub, 'fonts', f))
}

/* Grain: four tiles of fine gaussian-ish noise, cycled per frame. Deterministic. */
let seed = 7
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0
  return seed / 4294967296
}
mkdirSync(path.join(pub, 'grain'), { recursive: true })
for (let t = 0; t < 4; t++) {
  const n = 256
  const px = Buffer.alloc(n * n)
  for (let i = 0; i < px.length; i++) {
    const g = (rnd() + rnd() + rnd() + rnd()) / 4
    px[i] = Math.max(0, Math.min(255, Math.round(128 + (g - 0.5) * 2.4 * 255)))
  }
  writeFileSync(path.join(pub, `grain/${t}.png`), encodePng(n, n, 1, px))
}

/* The symbol, sampled into cells: a cell is in the mark when most of it is covered. */
const mark = decodePng(readFileSync(path.join(pub, 'brand/symbol.png')))
const COLS = 56
const cell = mark.width / COLS
const ROWS = Math.round(mark.height / cell)
const cells = []
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    let sum = 0
    let count = 0
    for (let y = Math.floor(r * cell); y < Math.min(mark.height, Math.floor((r + 1) * cell)); y++) {
      for (
        let x = Math.floor(c * cell);
        x < Math.min(mark.width, Math.floor((c + 1) * cell));
        x++
      ) {
        sum += mark.data[(y * mark.width + x) * mark.channels + mark.channels - 1]
        count++
      }
    }
    if (count && sum / count / 255 > 0.42) cells.push([c, r])
  }
}
writeFileSync(
  path.join(film, 'src/generated/monogram-cells.json'),
  JSON.stringify({ cols: COLS, rows: ROWS, aspect: mark.width / mark.height, cells }) + '\n',
)
console.log(`film assets ready: ${cells.length} symbol cells (${COLS}x${ROWS})`)
