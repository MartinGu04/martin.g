import { describe, expect, it } from 'vitest'
import { EM_DASH } from '../../scripts/lint-policy.mjs'
import { locales } from '@/i18n/config'
import { caseOnCopy, caseOnMedia, caseOnReview } from '@/i18n/dictionaries/case-on'
import {
  caseMiMaMoCopy,
  caseMiMaMoMedia,
  caseMiMaMoReview,
} from '@/i18n/dictionaries/case-mi-ma-mo'
import { onCrops, onMedia } from '@/content/projects/on'
import { miMaMo, miMaMoCrops, miMaMoMarks, miMaMoMedia } from '@/content/projects/mi-ma-mo'
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
  it('is approved in both locales', () => {
    // Approved by Martin after review; the release gate refuses it again if marked draft.
    expect(caseOnReview).toEqual({ en: 'approved', he: 'approved' })
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

describe('המחלבה case study copy', () => {
  it('is draft in both locales until Martin reviews it', () => {
    // The release gate refuses a Vercel production build while either locale is draft.
    expect(caseMiMaMoReview).toEqual({ en: 'draft', he: 'draft' })
  })

  it('has the same structure in both locales, apart from the translated quote', () => {
    const strip = (keys: string[]) => keys.filter((k) => !k.endsWith('quote.original'))
    expect(strip(shape(caseMiMaMoCopy.he)).sort()).toEqual(strip(shape(caseMiMaMoCopy.en)).sort())
  })

  it('has no empty strings and no em dashes', () => {
    for (const locale of locales) {
      for (const s of [...leaves(caseMiMaMoCopy[locale]), ...leaves(caseMiMaMoMedia)]) {
        expect(s.trim()).not.toBe('')
        expect(s).not.toContain(EM_DASH)
      }
    }
  })

  it('claims no metric, adoption, outcome or testimonial', () => {
    const text = locales
      .flatMap((l) => [...leaves(caseMiMaMoCopy[l]), ...leaves(caseMiMaMoMedia)])
      .join(' ')
    expect(text).not.toMatch(
      /\d+\s*%|percent|users|adoption|adopted|increase|reduc|faster|saved|testimonial|award|mobile-first|אחוז|משתמשים|אימוץ|חיסכון|עלייה של/i,
    )
  })

  it('keeps the public name and never names confidential or removed material', () => {
    const text = locales.flatMap((l) => leaves(caseMiMaMoCopy[l])).join(' ')
    expect(text).toContain('המחלבה')
    expect(text).not.toMatch(
      /mi-ma-mo|confidential|classified|clearance|dossier|fairness|month view|טבלת צדק|מסווג/i,
    )
  })
})

describe('המחלבה case study media', () => {
  it('crops stay inside their real source images', () => {
    for (const [name, crop] of Object.entries(miMaMoCrops)) {
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

  it('crops are regions of the approved, sanitized screens, never new files', () => {
    const approved = new Set(Object.values(miMaMoMedia).map((m) => m.src))
    for (const [name, crop] of Object.entries(miMaMoCrops))
      expect(approved.has(crop.src), name).toBe(true)
  })

  it('crops carry alternative text in both locales', () => {
    for (const crop of Object.values(miMaMoCrops))
      for (const locale of locales) expect(crop.alt[locale].trim()).not.toBe('')
  })

  it('every annotation box lies inside the view it is drawn on', () => {
    const views = {
      picture: miMaMoCrops.nextShift,
      week: miMaMoCrops.teamWeek,
      phone: miMaMoCrops.phone,
    } as const
    for (const [view, boxes] of Object.entries(miMaMoMarks)) {
      const { region } = views[view as keyof typeof views]
      for (const [name, box] of Object.entries(boxes)) {
        const label = `${view}.${name}`
        expect(box.x, label).toBeGreaterThanOrEqual(region.x)
        expect(box.y, label).toBeGreaterThanOrEqual(region.y)
        expect(box.x + box.width, label).toBeLessThanOrEqual(region.x + region.width)
        expect(box.y + box.height, label).toBeLessThanOrEqual(region.y + region.height)
      }
    }
  })

  it('has no live link and no generic story blocks', () => {
    expect(miMaMo.links?.live).toBeUndefined()
    expect(miMaMo.story).toEqual([])
  })

  it('the card-blue register stays readable', () => {
    expect(themeIssues(worlds.miMaMoCard)).toEqual([])
  })
})
