import { readFileSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { getDictionary } from '@/i18n/get-dictionary'
import { locales } from '@/i18n/config'
import { findImageMetadata } from '../../scripts/lint-policy.mjs'
import {
  ADDRESS,
  CARDS,
  HEIGHT,
  OUTPUT_DIR,
  WIDTH,
  cardHtml,
  lockupGeometry,
} from '../../scripts/og-cards.mjs'

const file = (locale: 'en' | 'he') =>
  new URL(`../../${OUTPUT_DIR}/${CARDS[locale].file}`, import.meta.url)

/** PNG chunk types in order (IHDR first). */
function chunks(png: Buffer): string[] {
  const types: string[] = []
  for (let i = 8; i < png.length;) {
    const length = png.readUInt32BE(i)
    types.push(png.toString('latin1', i + 4, i + 8))
    i += 12 + length
  }
  return types
}

describe('social cards', () => {
  it('carry the approved principle of each locale, and nothing else but the address', () => {
    for (const locale of locales) {
      expect(CARDS[locale].principle).toBe(getDictionary(locale).site.principle)
      const html = cardHtml(locale)
      const body = html.slice(html.indexOf('<body>'), html.indexOf('</body>'))
      const words = body
        .replace(/<br>/g, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      expect(words, locale).toBe(`${CARDS[locale].principle} ${ADDRESS}`)
    }
  })

  it('name the documented production origin', () => {
    const example = readFileSync(new URL('../../.env.example', import.meta.url), 'utf8')
    expect(example).toContain(`SITE_URL=https://${ADDRESS}`)
  })

  it('embed the approved lockup verbatim, set in the document’s language and direction', () => {
    const { width, height, inner } = lockupGeometry()
    const source = readFileSync(
      new URL('../../public/brand/martin-g-lockup.svg', import.meta.url),
      'utf8',
    )
    expect(source).toContain(`viewBox="0 0 ${width} ${height}"`)
    expect(source).toContain(inner)
    for (const locale of locales) {
      const html = cardHtml(locale)
      expect(html).toContain(inner)
      expect(html).toContain(`<html lang="${CARDS[locale].lang}" dir="${CARDS[locale].dir}">`)
    }
  })

  it('use no project, confidential or external material', () => {
    for (const locale of locales) {
      const html = cardHtml(locale)
      expect(html).not.toMatch(/<img|<video|<image|<iframe|<link/)
      expect(html).not.toMatch(/assets\/work|https?:\/\/(?!www\.w3\.org)/)
      // Fonts are the site's own, embedded; nothing is fetched.
      expect(
        html.match(/url\(([^)]{0,30})/g)?.every((u) => u.startsWith('url(data:font/woff2')),
      ).toBe(true)
    }
  })

  it('are 1200 x 630 PNGs without metadata, small enough for every platform', () => {
    expect([WIDTH, HEIGHT]).toEqual([1200, 630])
    for (const locale of locales) {
      const png = readFileSync(file(locale))
      expect(png.readUInt32BE(16), locale).toBe(1200)
      expect(png.readUInt32BE(20), locale).toBe(630)
      expect([...new Set(chunks(png))], locale).toEqual(['IHDR', 'IDAT', 'IEND'])
      expect(findImageMetadata(png), locale).toEqual([])
      expect(statSync(file(locale)).size, locale).toBeLessThan(300 * 1024)
    }
  })

  it('differ by locale', () => {
    expect(readFileSync(file('he')).equals(readFileSync(file('en')))).toBe(false)
  })
})
