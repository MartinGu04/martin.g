#!/usr/bin/env node
/**
 * Renders the MARTIN.G icon set from the approved MG symbol (public/brand/martin-g-symbol.svg).
 * The symbol itself is never altered: it is placed, sized and colored, nothing else.
 *
 *   pnpm brand:icons    (needs Playwright's Chromium; PLAYWRIGHT_CHROMIUM_PATH if preinstalled)
 *
 * The tile: the MARTIN.G world in miniature. Cinematic black, one warm key light falling
 * from the top inline-start corner into shade (the only kind of gradient the brand allows),
 * the symbol in bone, optically centered. A hairline warm edge keeps the tile defined on dark
 * browser chrome; on light chrome the dark tile itself is the contrast.
 *
 *   src/app/icon.svg            scalable favicon, rounded tile
 *   src/app/favicon.ico         16, 32, 48 (the symbol a little larger, so it holds at 16px)
 *   src/app/icon.png            512, rounded tile
 *   src/app/apple-icon.png      180, full bleed (iOS applies its own rounding)
 *   public/icons/icon-192.png   manifest "any", rounded tile
 *   public/icons/icon-512.png   manifest "any", rounded tile
 *   public/icons/maskable-512.png  manifest "maskable": full bleed, the symbol inside the
 *                               80% safe zone that Android's masks keep
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const symbolSvg = readFileSync(path.join(root, 'public/brand/martin-g-symbol.svg'), 'utf8')
const [, vbW, vbH] = symbolSvg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/).map(Number)
const symbolPath = symbolSvg.match(/<path d="([^"]+)"/)[1]

const INK = '#060606' // --mg-black
const LIGHT = '#2b2620' // the warm key light, as it falls on black
const BONE = '#f5f3ee' // --mg-bone
const EDGE = '#3d3832' // hairline edge for dark browser chrome

/**
 * One tile as SVG (a 100-unit square). `fill` is the symbol's width as a share of the tile;
 * `radius` the corner radius in units (0 = full bleed); `edge` draws the hairline edge.
 */
export function tile({ fill, radius, edge }) {
  const w = 100 * fill
  const h = (w * vbH) / vbW
  const x = (100 - w) / 2
  // Optical center: a touch above the geometric one (the symbol is heavier at the top).
  const y = (100 - h) / 2 - h * 0.02
  const k = w / vbW
  const shape = radius
    ? `<rect width="100" height="100" rx="${radius}" fill="url(#l)"/>`
    : `<rect width="100" height="100" fill="url(#l)"/>`
  const outline =
    edge && radius
      ? `<rect x="0.5" y="0.5" width="99" height="99" rx="${radius - 0.5}" fill="none" stroke="${EDGE}" stroke-width="1"/>`
      : ''
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">` +
    `<defs><radialGradient id="l" cx="18" cy="0" r="120" gradientUnits="userSpaceOnUse">` +
    `<stop offset="0" stop-color="${LIGHT}"/><stop offset="0.75" stop-color="${INK}"/></radialGradient></defs>` +
    shape +
    outline +
    `<path transform="translate(${x.toFixed(3)} ${y.toFixed(3)}) scale(${k.toFixed(6)})" ` +
    `fill="${BONE}" fill-rule="evenodd" d="${symbolPath}"/></svg>\n`
  )
}

const rounded = { fill: 0.6, radius: 22, edge: true }
const fullBleed = { fill: 0.6, radius: 0, edge: false }
const small = { fill: 0.72, radius: 22, edge: true }
const maskable = { fill: 0.5, radius: 0, edge: false }

/** A minimal ICO container holding PNG images (supported by every current browser). */
function ico(pngs) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(pngs.length, 4)
  let offset = 6 + 16 * pngs.length
  const entries = pngs.map(({ size, data }) => {
    const e = Buffer.alloc(16)
    e.writeUInt8(size >= 256 ? 0 : size, 0)
    e.writeUInt8(size >= 256 ? 0 : size, 1)
    e.writeUInt16LE(1, 4) // color planes
    e.writeUInt16LE(32, 6) // bits per pixel
    e.writeUInt32LE(data.length, 8)
    e.writeUInt32LE(offset, 12)
    offset += data.length
    return e
  })
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)])
}

async function main() {
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined
  const browser = await chromium.launch(executablePath ? { executablePath } : {})
  const page = await browser.newPage({ deviceScaleFactor: 1 })
  const render = async (spec, size) => {
    await page.setViewportSize({ width: size, height: size })
    await page.setContent(
      `<html><body style="margin:0;background:transparent">${tile(spec).replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`,
    )
    return page.screenshot({
      omitBackground: true,
      clip: { x: 0, y: 0, width: size, height: size },
    })
  }

  writeFileSync(path.join(root, 'src/app/icon.svg'), tile(rounded))
  writeFileSync(path.join(root, 'src/app/icon.png'), await render(rounded, 512))
  writeFileSync(path.join(root, 'src/app/apple-icon.png'), await render(fullBleed, 180))
  const favicon = []
  for (const size of [16, 32, 48]) favicon.push({ size, data: await render(small, size) })
  writeFileSync(path.join(root, 'src/app/favicon.ico'), ico(favicon))
  mkdirSync(path.join(root, 'public/icons'), { recursive: true })
  writeFileSync(path.join(root, 'public/icons/icon-192.png'), await render(rounded, 192))
  writeFileSync(path.join(root, 'public/icons/icon-512.png'), await render(rounded, 512))
  writeFileSync(path.join(root, 'public/icons/maskable-512.png'), await render(maskable, 512))
  await browser.close()
  console.log('brand-icons: written.')
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await main()
}
