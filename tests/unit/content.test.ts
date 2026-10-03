import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { EM_DASH, findImageMetadata } from '../../scripts/lint-policy.mjs'
import { locales } from '@/i18n/config'
import { dictionaries } from '@/i18n/dictionaries'
import {
  getAllProjectsForChecks,
  getConfidentialProjects,
  getProjectSequence,
  getPublicProject,
  getPublicProjects,
} from '@/content/registry'
import { resolveConfidentialSummary } from '@/content/resolve'
import {
  confidentialAllowedKeys,
  INTERFACE_COVER_EXCEPTION,
  type Media,
  type Project,
} from '@/content/schema'
import { contrast } from '../support/contrast'

const all = getAllProjectsForChecks()

/** Collects every localized string in a value, for copy rules. */
function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value)
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out))
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => strings(v, out))
  return out
}

function media(project: Project): Media[] {
  if (project.visibility !== 'public') return []
  return [
    project.cover,
    ...project.story.flatMap((block) =>
      block.type === 'media'
        ? [block.media]
        : block.type === 'sequence'
          ? block.items.map((item) => item.media)
          : [],
    ),
  ]
}

describe('project registry', () => {
  it('has unique ids and orders', () => {
    expect(new Set(all.map((p) => p.id)).size).toBe(all.length)
    expect(new Set(all.map((p) => p.order)).size).toBe(all.length)
  })

  it('uses ASCII kebab-case ids', () => {
    for (const p of all) expect(p.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  })

  it('has non-empty copy in every locale', () => {
    for (const p of all) {
      for (const locale of locales) {
        expect(p.title[locale].trim(), `${p.id} title ${locale}`).not.toBe('')
        expect(p.summary[locale].trim(), `${p.id} summary ${locale}`).not.toBe('')
      }
    }
  })

  it('presents mi-ma-mo publicly as המחלבה, keeping its id and slug', () => {
    const project = all.find((p) => p.id === 'mi-ma-mo')
    expect(project?.title).toEqual({ en: 'המחלבה', he: 'המחלבה' })
    expect(getPublicProject('mi-ma-mo')?.id).toBe('mi-ma-mo')
  })

  it('links only to approved live sites, over https', () => {
    const live = Object.fromEntries(
      getPublicProjects().map((p) => [p.id, p.links?.live ?? null] as const),
    )
    expect(live).toEqual({ on: 'https://www.onbyortal.com/', 'mi-ma-mo': null })
  })

  it('has no em dashes in any project copy', () => {
    for (const s of strings(all)) expect(s).not.toContain(EM_DASH)
  })

  it('gives every non-decorative media item alt text in every locale', () => {
    for (const p of all) {
      for (const m of media(p)) {
        if (m.kind === 'image' && m.decorative) continue
        for (const locale of locales) expect(m.alt[locale].trim()).not.toBe('')
      }
    }
  })

  it('keeps project themes readable', () => {
    for (const p of getPublicProjects()) {
      if (!p.theme) continue
      const { surface0, surface1, text, textMuted } = p.theme.colors
      for (const surface of [surface0, surface1]) {
        expect(contrast(text, surface)).toBeGreaterThanOrEqual(4.5)
        expect(contrast(textMuted, surface)).toBeGreaterThanOrEqual(4.5)
      }
    }
  })
})

describe('project sequence', () => {
  it('numbers routed work first, then confidential work, continuously', () => {
    expect(getProjectSequence().map(({ project, number }) => `${number} ${project.id}`)).toEqual([
      '01 on',
      '02 mi-ma-mo',
      '03 confidential-01',
      '04 confidential-02',
    ])
  })
})

describe('confidential projects', () => {
  const confidential = all.filter((p) => p.visibility === 'confidential')

  it('exist with generic public identities only', () => {
    expect(confidential.map((p) => p.id).sort()).toEqual(['confidential-01', 'confidential-02'])
  })

  it('carry only allowlisted keys', () => {
    for (const p of confidential) {
      for (const key of Object.keys(p)) {
        expect(confidentialAllowedKeys as readonly string[], `${p.id}.${key}`).toContain(key)
      }
    }
  })

  it('never get a route', () => {
    for (const p of confidential) expect(getPublicProject(p.id)).toBeUndefined()
    const routed = getPublicProjects().map((p) => p.id)
    for (const p of confidential) expect(routed).not.toContain(p.id)
  })

  it('resolve to summaries without links, routes or media fields', () => {
    for (const p of getConfidentialProjects()) {
      const summary = resolveConfidentialSummary(p, 'en', dictionaries.en.messages)
      expect(Object.keys(summary).sort()).toEqual(
        [
          'cover',
          'disciplines',
          'id',
          'summary',
          'title',
          ...(summary.years ? ['years'] : []),
        ].sort(),
      )
      expect(JSON.stringify(summary)).not.toMatch(/href|https?:|\/work\//)
    }
  })

  it('are one card per project: abstract geometry, except confidential-01’s approved image', () => {
    const covers = Object.fromEntries(confidential.map((p) => [p.id, p.cover.kind]))
    expect(covers).toEqual({
      'confidential-01': 'approved-interface',
      'confidential-02': 'abstract',
    })
    expect(INTERFACE_COVER_EXCEPTION).toBe('confidential-01')
    // Exactly one image file exists for confidential work, and it is the approved one.
    const dir = path.resolve(__dirname, '../../src/assets/confidential')
    expect(readdirSync(dir)).toEqual(['confidential-01-interface.webp'])
    const hash = createHash('sha256')
      .update(readFileSync(path.join(dir, 'confidential-01-interface.webp')))
      .digest('hex')
    // Pinned: a new image is a deliberate change, reviewed and approved by Martin.
    expect(hash).toBe('a9c34e6162b2a063ca965e7a686d954a4deb00a889e7e7c5e7f4f95268c573aa')
    expect(
      findImageMetadata(readFileSync(path.join(dir, 'confidential-01-interface.webp'))),
    ).toEqual([])
  })

  it('refuses an interface image for any other confidential project, at runtime too', () => {
    const imposter = {
      ...getConfidentialProjects().find((p) => p.id === 'confidential-01')!,
      id: 'confidential-02',
    } as unknown as Parameters<typeof resolveConfidentialSummary>[0]
    expect(() => resolveConfidentialSummary(imposter, 'en', dictionaries.en.messages)).toThrow(
      /Only confidential-01 may show an interface image/,
    )
  })

  it('describe confidential-01 neutrally, with generic alt text, in both locales', () => {
    const project = confidential.find((p) => p.id === 'confidential-01')!
    expect(project.title.he).toBe('מערכת לניהול תהליכים')
    expect(project.summary.he).toBe(
      'כלי ייעודי לניהול מידע, תהליכי עבודה והפקת תוצרים בסביבת עבודה פנימית.',
    )
    expect(project.cover.kind).toBe('approved-interface')
    const alt = project.cover.kind === 'approved-interface' ? project.cover.alt : null
    const text = [
      ...Object.values(project.title),
      ...Object.values(project.summary),
      ...Object.values(alt ?? {}),
      ...project.disciplines.map((d) => dictionaries.en.messages.disciplines[d]),
      ...project.disciplines.map((d) => dictionaries.he.messages.disciplines[d]),
    ]
      .join(' ')
      .toLowerCase()
    for (const term of [
      'classified',
      'confidential',
      'compartment',
      'secret',
      'military',
      'operational',
      'security',
      'defense',
      'מסווג',
      'חסוי',
      'ממודר',
      'מידור',
      'סודי',
      'צבאי',
      'מבצעי',
      'תפעולי',
      'ביטחוני',
      'אבטחה',
    ])
      expect(text, term).not.toContain(term)
  })
})
