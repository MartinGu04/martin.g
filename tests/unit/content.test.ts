import { describe, expect, it } from 'vitest'
import { EM_DASH } from '../../scripts/lint-policy.mjs'
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
import { confidentialAllowedKeys, type Media, type Project } from '@/content/schema'
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
  return project.visibility === 'public' ? [project.cover] : []
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

  it('uses the public brand spelling mi-ma-mo', () => {
    const project = all.find((p) => p.id === 'mi-ma-mo')
    expect(project?.title.en).toBe('mi-ma-mo')
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

  it('resolve to summaries without links or media', () => {
    for (const p of getConfidentialProjects()) {
      const summary = resolveConfidentialSummary(p, 'en', dictionaries.en.messages)
      expect(Object.keys(summary).sort()).toEqual(
        [
          'disciplines',
          'id',
          'pattern',
          'summary',
          'title',
          ...(summary.years ? ['years'] : []),
        ].sort(),
      )
      expect(JSON.stringify(summary)).not.toMatch(/href|https?:|\/work\//)
    }
  })
})
