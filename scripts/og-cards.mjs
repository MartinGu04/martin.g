#!/usr/bin/env node
/**
 * Renders the MARTIN.G social cards (Open Graph and Twitter) from the approved lockup
 * (public/brand/martin-g-lockup.svg) and the site's own fonts (src/fonts). The lockup is
 * never altered: it is placed, sized and colored, nothing else, and never mirrored.
 *
 *   pnpm brand:og    (needs Playwright's Chromium; PLAYWRIGHT_CHROMIUM_PATH if preinstalled)
 *
 * The card is the homepage hero in miniature, in the hero's own vocabulary: cinematic black
 * (--surface-0), one warm key light falling from above into shade (the only gradient the
 * brand allows), the grid drawn only where the light falls, registration marks on the
 * margins, the lockup in bone, and the principle set like the hero statement (Archivo 800
 * at 125% width; Noto Sans Hebrew 900). The site's address is a footer label.
 *
 *   src/assets/social/martin-g-he.png   1200 x 630, Hebrew
 *   src/assets/social/martin-g-en.png   1200 x 630, English
 *
 * Copy is the approved `site.principle` of each dictionary (tests/unit/og-cards.test.ts keeps
 * the two in step); nothing else is written on the card. Rendering is deterministic for a
 * given Chromium build.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export const WIDTH = 1200
export const HEIGHT = 630

/** The card's words: the approved principle (en.ts / he.ts `site.principle`) and the address. */
export const CARDS = Object.freeze({
  he: { lang: 'he', dir: 'rtl', principle: 'מבעיה למוצר.', file: 'martin-g-he.png' },
  en: { lang: 'en', dir: 'ltr', principle: 'From problem to product.', file: 'martin-g-en.png' },
})
export const ADDRESS = 'martin-g.dev'
export const OUTPUT_DIR = 'src/assets/social'
const MARK = 40

/** Brand tokens (src/styles/tokens.css). */
const INK = '#060606' // --mg-black, --surface-0
const BONE = '#f5f3ee' // --mg-bone, --text
const ASH = '#b3b1ac' // --mg-ash, --text-muted
const LIGHT = '255 244 230' // --mg-light, as rgb channels

const fontData = (file) => readFileSync(path.join(root, 'src/fonts', file)).toString('base64')

/**
 * The approved lockup, verbatim: its viewBox and its markup (the symbol's path and the
 * wordmark's, which carries its own transform), copied unchanged into the card.
 */
export function lockupGeometry() {
  const svg = readFileSync(path.join(root, 'public/brand/martin-g-lockup.svg'), 'utf8')
  const [, w, h] = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/).map(Number)
  const inner = svg.slice(svg.indexOf('>') + 1, svg.lastIndexOf('</svg>'))
  if (!/^(<path [^>]*\/>)+$/.test(inner)) {
    throw new Error('og-cards: expected the lockup to contain only paths')
  }
  return { width: w, height: h, inner }
}

/** The card as a standalone HTML document. */
export function cardHtml(locale) {
  const card = CARDS[locale]
  const lockup = lockupGeometry()
  const hebrew = locale === 'he'
  // Margins: the grid's outer margin, generous enough for platforms that crop the edges
  // (2:1 previews lose about 15px top and bottom; square thumbnails keep the center).
  const inline = 88
  const block = 72
  const lockupHeight = 176
  const lockupWidth = (lockupHeight * lockup.width) / lockup.height
  const columns = 12
  const gutter = 24
  const column = (WIDTH - 2 * inline - (columns - 1) * gutter) / columns
  // One line where each column starts, and one where the last ends.
  const edges = Array.from({ length: columns }, (_, i) => inline + i * (column + gutter))
  edges.push(WIDTH - inline)
  const gridLines = edges
    .map((x) => `<i style="inset-inline-start:${Math.round(x)}px"></i>`)
    .join('')
  // Registration marks in the outer margin, clear of the content.
  const mark = (side, edge) =>
    `<b class="mark" style="${side}:${MARK - 7}px;${edge}:${MARK - 7}px"></b>`

  return `<!doctype html>
<html lang="${card.lang}" dir="${card.dir}">
<head>
<meta charset="utf-8">
<style>
@font-face { font-family: Archivo; src: url(data:font/woff2;base64,${fontData('archivo-latin-wdth-wght.woff2')}) format('woff2');
  font-weight: 300 900; font-stretch: 100% 125%; }
@font-face { font-family: 'Noto Sans Hebrew'; src: url(data:font/woff2;base64,${fontData('noto-sans-hebrew-hebrew-wght.woff2')}) format('woff2');
  font-weight: 100 900; unicode-range: U+0590-05FF, U+FB1D-FB4F; }
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }
body { position: relative; background: ${INK}; color: ${BONE};
  font-family: ${hebrew ? `'Noto Sans Hebrew', Archivo` : `Archivo`};
  -webkit-font-smoothing: antialiased; text-rendering: geometricPrecision; }
/* One warm key light from above the inline-start third, falling off into shade. */
.light { position: absolute; inset: 0;
  background: radial-gradient(70% 95% at ${hebrew ? '64%' : '36%'} -18%, rgb(${LIGHT} / 0.16), rgb(${LIGHT} / 0.05) 48%, transparent 78%); }
/* The grid, drawn only inside the light. */
.grid { position: absolute; inset: 0;
  -webkit-mask-image: radial-gradient(62% 90% at ${hebrew ? '64%' : '36%'} -10%, #000 0%, transparent 82%); }
.grid i { position: absolute; inset-block: 0; inline-size: 1px; background: rgb(255 255 255 / 0.05); }
.mark { position: absolute; inline-size: 14px; block-size: 14px; }
.mark::before, .mark::after { content: ''; position: absolute; background: rgb(255 255 255 / 0.22); }
.mark::before { inset-inline-start: 7px; inset-block: 0; inline-size: 1px; }
.mark::after { inset-block-start: 7px; inset-inline: 0; block-size: 1px; }
.lockup { position: absolute; inset-block-start: ${block}px; inset-inline-start: ${inline}px;
  inline-size: ${lockupWidth.toFixed(2)}px; block-size: ${lockupHeight}px; color: ${BONE}; }
.lockup svg { display: block; inline-size: 100%; block-size: 100%; }
.principle { position: absolute; inset-inline: ${inline}px; inset-block-end: ${block + 62}px;
  ${
    hebrew
      ? 'font-size: 132px; font-weight: 900; line-height: 1; letter-spacing: 0;'
      : 'font-size: 104px; font-weight: 800; font-stretch: 125%; line-height: 0.88; letter-spacing: -0.045em;'
  } }
.footer { position: absolute; inset-inline: ${inline}px; inset-block-end: ${block}px;
  display: flex; align-items: center; gap: 20px; }
.footer .rule { flex: 1; block-size: 1px; background: rgb(255 255 255 / 0.12); }
.address { font-family: Archivo; font-size: 20px; font-weight: 600; font-stretch: 112%;
  letter-spacing: 0.16em; color: ${ASH}; direction: ltr; unicode-bidi: isolate; }
</style>
</head>
<body>
<div class="light"></div>
<div class="grid">${gridLines}</div>
${mark('inset-inline-start', 'inset-block-start')}${mark('inset-inline-end', 'inset-block-start')}
${mark('inset-inline-start', 'inset-block-end')}${mark('inset-inline-end', 'inset-block-end')}
<div class="lockup"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lockup.width} ${lockup.height}" fill="currentColor" fill-rule="evenodd" role="img" aria-label="MARTIN.G">${lockup.inner}</svg></div>
<p class="principle">${hebrew ? card.principle : card.principle.replace(' to ', '<br>to ')}</p>
<div class="footer"><span class="rule"></span><span class="address">${ADDRESS}</span></div>
</body>
</html>`
}

async function main() {
  const { chromium } = await import('@playwright/test')
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined
  const browser = await chromium.launch(executablePath ? { executablePath } : {})
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  })
  mkdirSync(path.join(root, OUTPUT_DIR), { recursive: true })
  for (const locale of Object.keys(CARDS)) {
    await page.setContent(cardHtml(locale))
    const loaded = await page.evaluate(async () => {
      const faces = await Promise.all([
        document.fonts.load('800 104px Archivo', 'From'),
        document.fonts.load('900 132px "Noto Sans Hebrew"', 'מבעיה'),
      ])
      await document.fonts.ready
      return faces.map((list) => list.length)
    })
    if (loaded.some((count) => count === 0)) throw new Error('og-cards: a site font did not load')
    const png = await page.screenshot({ clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } })
    writeFileSync(path.join(root, OUTPUT_DIR, CARDS[locale].file), png)
  }
  await browser.close()
  console.log(`og-cards: written to ${OUTPUT_DIR}.`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await main()
}
