import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { INTRO_FILMS, introScript } from '@/components/intro/intro-script'
import { introCopy, introReview } from '@/i18n/dictionaries/intro'
import { EM_DASH } from '../../scripts/lint-policy.mjs'

const film = (src: string) => readFileSync(new URL(`../../public${src}`, import.meta.url))

/** Top-level MP4 boxes, in file order. */
function topLevelBoxes(buffer: Buffer): string[] {
  const boxes: string[] = []
  for (let offset = 0; offset + 8 <= buffer.length;) {
    const size = buffer.readUInt32BE(offset)
    boxes.push(buffer.toString('latin1', offset + 4, offset + 8))
    if (size < 8) break
    offset += size
  }
  return boxes
}

/** Every handler type (vide, soun, mdir, ...) declared in the movie header. */
function handlers(buffer: Buffer): string[] {
  const out: string[] = []
  for (let i = buffer.indexOf('hdlr'); i !== -1; i = buffer.indexOf('hdlr', i + 4)) {
    out.push(buffer.toString('latin1', i + 12, i + 16))
  }
  return out
}

/** Width and height of the AVC sample entry. */
function dimensions(buffer: Buffer): [number, number] {
  const i = buffer.indexOf('avc1', buffer.indexOf('stsd'))
  return [buffer.readUInt16BE(i + 28), buffer.readUInt16BE(i + 30)]
}

describe('brand intro films', () => {
  for (const [shape, entry] of Object.entries(INTRO_FILMS)) {
    describe(shape, () => {
      const buffer = film(entry.src)

      it('streams from the first bytes: the movie header comes before the media', () => {
        const boxes = topLevelBoxes(buffer)
        expect(boxes.indexOf('moov')).toBeGreaterThanOrEqual(0)
        expect(boxes.indexOf('moov')).toBeLessThan(boxes.indexOf('mdat'))
      })

      it('is picture only: no soundtrack is shipped, since the intro is always silent', () => {
        // The movie header holds the track handlers; media data never needs to be read.
        const moov = buffer.subarray(0, buffer.indexOf('mdat'))
        expect(moov.toString('latin1').split('trak')).toHaveLength(2)
        expect(handlers(moov)).toContain('vide')
        expect(handlers(moov)).not.toContain('soun')
      })

      it('is its own edit in its own orientation', () => {
        const [width, height] = dimensions(buffer)
        expect(shape === 'portrait' ? height > width : width > height).toBe(true)
        expect(entry.handoff).toBeGreaterThan(0)
      })

      it('carries no metadata tags (no encoder, authoring tool or comment)', () => {
        const moov = buffer.subarray(0, buffer.indexOf('mdat'))
        const ilst = moov.indexOf('ilst')
        // The muxer leaves an empty tag list (eight bytes: its size and type) and nothing else.
        if (ilst !== -1) expect(moov.readUInt32BE(ilst - 4)).toBe(8)
        for (const tag of ['Remotion', 'Lavf', '\u00a9too', '\u00a9cmt']) {
          expect(moov.includes(tag, 0, 'latin1')).toBe(false)
        }
      })
    })
  }
})

describe('brand intro script', () => {
  it('is approved copy in both locales', () => {
    expect(introReview).toEqual({ en: 'approved', he: 'approved' })
    expect(introCopy.he).toEqual({ skip: 'דלג', film: 'סרט' })
  })

  it('carries one locale, safely escaped, and no em dash', () => {
    for (const locale of ['en', 'he'] as const) {
      const script = introScript({
        home: `/${locale}`,
        name: 'MARTIN.G',
        skip: introCopy[locale].skip,
        classes: { intro: 'a', film: 'b', skip: 'c' },
      })
      expect(script).toContain(JSON.stringify(introCopy[locale].skip))
      expect(script).not.toContain(introCopy[locale === 'en' ? 'he' : 'en'].skip)
      expect(script).not.toContain('</')
      expect(script).not.toContain(EM_DASH)
      // Parses as a script.
      expect(() => new Function(script)).not.toThrow()
    }
  })
})
