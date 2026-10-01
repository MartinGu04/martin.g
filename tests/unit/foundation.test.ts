import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cellVars } from '@/components/layout/Grid'
import { assertReleasableCopy, findDraftCopy } from '@/i18n/release-gate'
import { localeAlternates } from '@/lib/site'
import {
  checkCss,
  checkEmDash,
  checkInvisibleChars,
  checkJsx,
  checkNextPublic,
  checkSourceMaps,
  checkSvg,
  EM_DASH,
  findImageMetadata,
} from '../../scripts/lint-policy.mjs'
import { contrast } from '../support/contrast'

const tokens = readFileSync(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8')
const token = (name: string) => {
  const match = tokens.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))
  if (!match?.[1]) throw new Error(`token ${name} not found`)
  return match[1]
}

describe('brand tokens', () => {
  it('meet WCAG AA for text on both surfaces', () => {
    for (const surface of ['mg-black', 'mg-graphite']) {
      expect(contrast(token('mg-bone'), token(surface))).toBeGreaterThanOrEqual(7)
      expect(contrast(token('mg-ash'), token(surface))).toBeGreaterThanOrEqual(4.5)
      // WCAG 1.4.11: UI boundaries such as form borders need 3:1.
      expect(contrast(token('mg-control'), token(surface))).toBeGreaterThanOrEqual(3)
    }
  })

  it('keeps structural lines subtle (white at 10% over the background)', () => {
    const match = tokens.match(/--mg-line:\s*rgb\(255 255 255 \/ ([0-9.]+)\)/)
    const alpha = Number(match?.[1])
    expect(alpha).toBeCloseTo(0.1, 3)
    const base = Number.parseInt(token('mg-black').slice(1, 3), 16)
    const blended = Math.round(base + (255 - base) * alpha)
    const hex = `#${blended.toString(16).padStart(2, '0').repeat(3)}`
    expect(contrast(hex, token('mg-black'))).toBeLessThan(1.5)
  })
})

describe('grid', () => {
  it('maps responsive spans and starts to custom properties', () => {
    expect(cellVars({ base: 4, md: 6, lg: 7 }, { lg: 2 })).toEqual({
      '--span': 4,
      '--span-md': 6,
      '--span-lg': 7,
      '--start-lg': 2,
    })
    expect(cellVars()).toEqual({})
  })
})

describe('metadata', () => {
  it('builds canonical and hreflang alternates', () => {
    expect(localeAlternates('he', '/work/on')).toEqual({
      canonical: '/he/work/on',
      languages: { en: '/en/work/on', he: '/he/work/on', 'x-default': '/he/work/on' },
    })
  })
})

describe('release gate', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('finds no copy awaiting review', () => {
    // The Phase 4 showcase copy is approved in both locales; any dictionary marked
    // 'draft' again would appear here and block a Vercel production build.
    expect(findDraftCopy()).toEqual([])
  })

  it('refuses synthetic draft copy in Vercel production builds only', () => {
    const drafts = ['dictionary:synthetic']

    vi.stubEnv('VERCEL_ENV', 'preview')
    expect(() => assertReleasableCopy(drafts)).not.toThrow()

    vi.stubEnv('VERCEL_ENV', 'production')
    expect(() => assertReleasableCopy(drafts)).toThrow(/Draft copy awaiting review/)

    vi.stubEnv('ALLOW_DRAFT_COPY_IN_PRODUCTION', '1')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(() => assertReleasableCopy(drafts)).not.toThrow()
    expect(warn).toHaveBeenCalled()
  })
})

describe('policy rules', () => {
  it('rejects physical CSS properties and accepts logical ones', () => {
    expect(checkCss('.a { margin-left: 1rem; }')).toHaveLength(1)
    expect(checkCss('.a {\n  left: 0;\n}')).toHaveLength(1)
    expect(checkCss('.a { text-align: right }')).toHaveLength(1)
    expect(checkCss('.a { border-top-left-radius: 2px }')).toHaveLength(1)
    expect(
      checkCss('.a { margin-inline-start: 1rem; inset-inline-end: 0; inset: 0 }'),
    ).toHaveLength(0)
    expect(checkCss('/* margin-left: 1rem */')).toHaveLength(0)
    expect(checkJsx('style={{ paddingRight: 4 }}')).toHaveLength(1)
    expect(checkJsx('style={{ paddingInlineEnd: 4 }}')).toHaveLength(0)
  })

  it('rejects em dashes and NEXT_PUBLIC_ variables', () => {
    expect(checkEmDash(`a ${EM_DASH} b`)).toHaveLength(1)
    expect(checkEmDash('2024–2026')).toHaveLength(0)
    expect(checkNextPublic('process.env.NEXT_PUBLIC_KEY')).toHaveLength(1)
    expect(checkNextPublic('no NEXT_PUBLIC_ prefix allowed')).toHaveLength(0)
  })

  it('rejects raw invisible and bidi control characters', () => {
    expect(checkInvisibleChars(`a${String.fromCodePoint(0x202e)}b`)).toHaveLength(1)
    expect(checkInvisibleChars(`a${String.fromCodePoint(0x200b)}b`)).toHaveLength(1)
    expect(checkInvisibleChars('const re = /[\\u202a-\\u202e]/')).toHaveLength(0)
    expect(checkInvisibleChars('עברית and English')).toHaveLength(0)
  })

  it('requires production browser source maps to stay disabled', () => {
    expect(checkSourceMaps('  productionBrowserSourceMaps: false,')).toHaveLength(0)
    expect(checkSourceMaps('  productionBrowserSourceMaps: true,')).toHaveLength(1)
    expect(checkSourceMaps('')).toHaveLength(1)
  })

  it('rejects editor metadata in SVGs', () => {
    expect(checkSvg('<svg><g data-name="Layer 1"/></svg>')).toHaveLength(1)
    expect(checkSvg('<svg viewBox="0 0 10 10"><path d="M0 0h10"/></svg>')).toHaveLength(0)
  })

  it('detects PNG text chunks and JPEG EXIF segments', () => {
    const chunk = (type: string, data: Buffer) => {
      const head = Buffer.alloc(8)
      head.writeUInt32BE(data.length, 0)
      head.write(type, 4, 'latin1')
      return Buffer.concat([head, data, Buffer.alloc(4)])
    }
    const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    const clean = Buffer.concat([
      signature,
      chunk('IHDR', Buffer.alloc(13)),
      chunk('IEND', Buffer.alloc(0)),
    ])
    const tagged = Buffer.concat([
      signature,
      chunk('tEXt', Buffer.from('Title\0x')),
      chunk('IEND', Buffer.alloc(0)),
    ])
    expect(findImageMetadata(clean)).toEqual([])
    expect(findImageMetadata(tagged)).toEqual(['PNG tEXt'])
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x04, 0x00, 0x00, 0xff, 0xda])
    expect(findImageMetadata(jpeg)).toEqual(['JPEG APP1 (Exif/XMP)'])
  })
})
