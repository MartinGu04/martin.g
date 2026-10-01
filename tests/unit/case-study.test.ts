import { describe, expect, it } from 'vitest'
import { EM_DASH } from '../../scripts/lint-policy.mjs'
import { locales } from '@/i18n/config'
import { caseOnCopy, caseOnMedia, caseOnReview } from '@/i18n/dictionaries/case-on'
import { onCrops, onMedia } from '@/content/projects/on'
import { worlds } from '@/content/worlds'
import { themeIssues } from '@/lib/theme'
import { imageSize } from '../support/image-size'

function shape(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix]
  if (Array.isArray(value)) return [`${prefix}[${value.length}]`]
  return Object.entries(value).flatMap(([k, v]) => shape(v, prefix ? `${prefix}.${k}` : k))
}

function leaves(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (typeof value !== 'object' || value === null) return []
  return Object.values(value).flatMap(leaves)
}

describe('ON case study copy', () => {
  it('is draft until Martin reviews it', () => {
    // New Phase 5 copy never ships as approved by default; the release gate holds it.
    expect(caseOnReview).toEqual({ en: 'draft', he: 'draft' })
  })

  it('has the same structure in both locales, apart from the translated quote', () => {
    const strip = (keys: string[]) => keys.filter((k) => !k.endsWith('quote.original'))
    expect(strip(shape(caseOnCopy.he)).sort()).toEqual(strip(shape(caseOnCopy.en)).sort())
  })

  it('has no empty strings and no em dashes', () => {
    for (const locale of locales) {
      for (const s of [...leaves(caseOnCopy[locale]), ...leaves(caseOnMedia)]) {
        expect(s.trim()).not.toBe('')
        expect(s).not.toContain(EM_DASH)
      }
    }
  })

  it('names no metric, score or testimonial it cannot support', () => {
    const text = locales.flatMap((l) => leaves(caseOnCopy[l])).join(' ')
    expect(text).not.toMatch(/%|conversion|increase|testimonial|award|המרה|עלייה של/i)
  })
})

describe('ON case study media', () => {
  it('crops stay inside their real source images', () => {
    for (const [name, crop] of Object.entries(onCrops)) {
      const size = imageSize(crop.src)
      expect(size.width, name).toBeGreaterThan(0)
      for (const region of [crop.region, crop.mobile].filter((r) => r !== undefined)) {
        expect(region.x, name).toBeGreaterThanOrEqual(0)
        expect(region.y, name).toBeGreaterThanOrEqual(0)
        expect(region.width, name).toBeGreaterThan(0)
        expect(region.height, name).toBeGreaterThan(0)
        expect(region.x + region.width, name).toBeLessThanOrEqual(size.width)
        expect(region.y + region.height, name).toBeLessThanOrEqual(size.height)
      }
    }
  })

  it('crops and images carry alternative text in both locales', () => {
    for (const media of [...Object.values(onCrops), ...Object.values(onMedia)]) {
      for (const locale of locales) expect(media.alt[locale].trim()).not.toBe('')
    }
  })

  it('crops are details of existing assets, never new files', () => {
    const sources = new Set(Object.values(onMedia).map((m) => (m.kind === 'video' ? null : m.src)))
    for (const crop of Object.values(onCrops)) expect(sources.has(crop.src)).toBe(true)
  })

  it('the screening-room world stays readable', () => {
    expect(themeIssues(worlds.onNight)).toEqual([])
  })
})
