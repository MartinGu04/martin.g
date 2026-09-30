import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { brandMarks, hairlineDevicePx, type BrandMarkKey } from '@/components/brand/brand'
import type { ProjectTheme } from '@/content/schema'
import { dictionaries } from '@/i18n/dictionaries'
import { primaryNav } from '@/lib/navigation'
import { isSpecimenEnabled } from '@/lib/specimen'
import { themeIssues } from '@/lib/theme'
import { qaThemes } from '@/app/[locale]/system/qa-themes'
import { worlds } from '@/content/worlds'

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')

describe('brand marks', () => {
  const marks = Object.keys(brandMarks) as BrandMarkKey[]

  it('minimum sizes keep a typical hairline at 0.55 device pixels or more', () => {
    for (const mark of marks) {
      for (const [dpr, height] of Object.entries(brandMarks[mark].minHeight)) {
        expect(
          hairlineDevicePx(mark, height, Number(dpr)),
          `${mark} at ${dpr}x`,
        ).toBeGreaterThanOrEqual(0.55)
      }
    }
  })

  it('CSS enforces exactly the manifest minimums', () => {
    const css = read('src/components/brand/BrandMark.module.css')
    const values = [...css.matchAll(/--mark-min:\s*([0-9.]+)rem/g)].map((m) => Number(m[1]) * 16)
    const expected = [1, 1.5, 2, 3].flatMap((dpr) =>
      marks.map((mark) => brandMarks[mark].minHeight[dpr as 1 | 1.5 | 2 | 3]),
    )
    expect(values).toEqual(expected)
  })

  it('assets exist and keep their proportions', () => {
    for (const mark of marks) {
      expect(existsSync(new URL(`../../public${brandMarks[mark].src}`, import.meta.url))).toBe(true)
    }
    expect(brandMarks.wordmark.width / brandMarks.wordmark.height).toBeCloseTo(5.855, 2)
    expect(brandMarks.monogram.width / brandMarks.monogram.height).toBeCloseTo(1.616, 2)
  })
})

describe('typography', () => {
  it('self-hosts both families with their licenses', () => {
    for (const file of [
      'src/fonts/archivo-latin-wdth-wght.woff2',
      'src/fonts/noto-sans-hebrew-hebrew-wght.woff2',
      'src/fonts/OFL-Archivo.txt',
      'src/fonts/OFL-NotoSansHebrew.txt',
    ]) {
      expect(existsSync(new URL(`../../${file}`, import.meta.url)), file).toBe(true)
    }
    expect(read('src/fonts/OFL-Archivo.txt')).toContain('SIL Open Font License')
    expect(read('src/fonts/OFL-NotoSansHebrew.txt')).toContain('SIL Open Font License')
  })

  it('limits each family to its script so mixed runs resolve per character', () => {
    const fonts = read('src/styles/fonts.ts')
    expect(fonts).toMatch(/U\+0590-05FF/)
    expect(fonts).toContain('adjustFontFallback: false')
    const roles = read('src/styles/fonts.css')
    expect(roles).not.toMatch(/--font-(latin|hebrew):/)
  })

  it('never tracks or uppercases Hebrew labels', () => {
    const tokens = read('src/styles/tokens.css')
    const hebrew = tokens.slice(tokens.indexOf(':root:lang(he)'))
    expect(hebrew).toMatch(/--label-transform:\s*none/)
    expect(hebrew).toMatch(/--label-tracking:\s*0;/)
    expect(hebrew).toMatch(/--display-tracking:\s*0;/)
  })
})

describe('themes', () => {
  const brand: ProjectTheme = {
    scheme: 'dark',
    colors: { surface0: '#0b0b0b', surface1: '#111111', text: '#f1f0ec', textMuted: '#949494' },
  }

  it('accepts the brand palette, the QA palettes and every world', () => {
    expect(themeIssues(brand)).toEqual([])
    expect(themeIssues(qaThemes.inverse)).toEqual([])
    expect(themeIssues(qaThemes.tinted)).toEqual([])

    for (const [name, world] of Object.entries(worlds)) {
      expect(themeIssues(world), name).toEqual([])
    }
  })

  it('validates light and shade colors like every other color', () => {
    const bad: ProjectTheme = { ...brand, colors: { ...brand.colors, light: '#fff' } }
    expect(themeIssues(bad)).toContain('light must be #rrggbb')
  })

  it('rejects low contrast, weak accents, a wrong scheme and non-hex colors', () => {
    const weak: ProjectTheme = {
      scheme: 'light',
      colors: { ...brand.colors, textMuted: '#3a3a3a', accent: '#222222', line: '#abc' },
    }
    const issues = themeIssues(weak)
    expect(issues).toContain('line must be #rrggbb')
    const fixed = themeIssues({ ...weak, colors: { ...weak.colors, line: '#1c1c1c' } })
    expect(fixed.some((i) => i.startsWith('textMuted on surface0'))).toBe(true)
    expect(fixed.some((i) => i.startsWith('accent on surface0'))).toBe(true)
    expect(fixed).toContain('scheme does not match surface0 lightness')
  })

  it('themes can only change color tokens', () => {
    const scope = read('src/components/theme/ThemeScope.tsx')
    const vars = [...scope.matchAll(/'(--[a-z0-9-]+)'/g)].map((m) => m[1])
    for (const name of vars) {
      expect(name).toMatch(/^--(surface-[01]|text|text-muted|line|accent|accent-2|light|shade)$/)
    }
  })

  it('project worlds carry no grammar: no spacing, type, grid or motion keys', () => {
    const schema = read('src/content/schema.ts')
    const theme = schema.slice(
      schema.indexOf('export interface ProjectTheme'),
      schema.indexOf('/* Case-study blocks'),
    )
    expect(theme).not.toMatch(/space|size|font|radius|column|duration|easing|motion/i)
  })
})

describe('navigation and specimen', () => {
  it('lists only real destinations', () => {
    const nav = primaryNav('he', dictionaries.he.messages)
    expect(nav.map((item) => item.href)).toEqual(['/he#work'])
    expect(nav.map((item) => item.key)).not.toContain('contact')
  })

  it('renders the specimen everywhere except Vercel production', () => {
    expect(isSpecimenEnabled({})).toBe(true)
    expect(isSpecimenEnabled({ VERCEL_ENV: 'preview' })).toBe(true)
    expect(isSpecimenEnabled({ VERCEL_ENV: 'production' })).toBe(false)
  })
})
