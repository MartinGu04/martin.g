/*
 * Leak-check tests. Every term here is a SYNTHETIC canary invented for testing.
 * Never put a real confidential term in a test, fixture, snapshot or file name.
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  ConfigError,
  TERMS_VAR,
  collapse,
  createMatcher,
  decodeTerms,
  loadTerms,
  normalize,
  redactPath,
} from '../../scripts/leak-check.mjs'
import { B64, HEBREW, LATIN, TERMS, cli, encode, tempDir } from '../support/leak-check'

const matcher = createMatcher(TERMS)
const hits = (text: string) => matcher.matchText(text)
const bufferHits = (buffer: Buffer) => matcher.matchBuffer(buffer)

const jsEscape = (s: string) =>
  [...s].map((c) => `\\u${c.codePointAt(0)!.toString(16).padStart(4, '0')}`).join('')

function expectNoTermInOutput(output: string) {
  for (const term of TERMS) {
    for (const word of term.split(' ')) {
      expect(normalize(output)).not.toContain(normalize(word))
    }
  }
  expect(collapse(output)).not.toContain(collapse(LATIN))
}

function git(cwd: string, ...args: string[]) {
  const result = spawnSync(
    'git',
    ['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', ...args],
    {
      cwd,
      encoding: 'utf8',
    },
  )
  if (result.status !== 0) throw new Error(result.stderr)
  return result.stdout
}

function tempRepo() {
  const dir = tempDir()
  git(dir, 'init', '-q', '-b', 'main')
  git(dir, 'config', 'core.hooksPath', '/dev/null')
  writeFileSync(path.join(dir, 'README.md'), 'clean\n')
  git(dir, 'add', '.')
  git(dir, 'commit', '-q', '-m', 'initial')
  return dir
}

describe('configuration', () => {
  it('decodes base64 terms and ignores blanks and comments', () => {
    expect(decodeTerms(encode(['# comment', '', LATIN, '  ', HEBREW]))).toEqual(TERMS)
  })

  it('rejects invalid base64 and too-short terms without echoing them', () => {
    expect(() => decodeTerms('not base64!')).toThrow(ConfigError)
    try {
      decodeTerms(encode(['ab']))
      expect.unreachable()
    } catch (error) {
      expect((error as Error).message).toContain('#1')
      expect((error as Error).message).not.toContain('ab')
    }
  })

  it('fails closed in CI and on Vercel, even with the local skip flag', () => {
    const root = tempDir()
    for (const env of [{ CI: 'true' }, { VERCEL: '1' }, { GITHUB_ACTIONS: 'true' }]) {
      expect(() =>
        loadTerms({ env: { ...env, LEAK_CHECK_ALLOW_UNCONFIGURED: '1' }, root }),
      ).toThrow(ConfigError)
    }
  })

  it('fails locally unless skipping is explicit', () => {
    const root = tempDir()
    expect(() => loadTerms({ env: {}, root })).toThrow(ConfigError)
    expect(loadTerms({ env: { LEAK_CHECK_ALLOW_UNCONFIGURED: '1' }, root })).toBeNull()
  })

  it('reads the variable from a gitignored .env.local', () => {
    const root = tempDir()
    writeFileSync(path.join(root, '.env.local'), `OTHER=1\n${TERMS_VAR}="${B64}"\n`)
    expect(loadTerms({ env: {}, root })).toEqual(TERMS)
  })
})

describe('normalization', () => {
  it('ignores case, diacritics, niqqud, final letters and invisible characters', () => {
    expect(hits('ZEPHYRQUILL NIMBEX')).toEqual([1])
    expect(hits('Zéphyrquill Nïmbex')).toEqual([1])
    expect(hits(`Zephyr${String.fromCodePoint(0x200b)}quill Nimbex`)).toEqual([1])
    expect(hits('גְּלַזְבְּרָנוֹף')).toEqual([2])
    expect(hits('הגלזברנופים')).toEqual([2])
  })

  it('matches separator variants through collapsing', () => {
    for (const variant of [
      'zephyrquill-nimbex',
      'zephyrquill_nimbex',
      'ZephyrquillNimbex',
      'zephyrquill.nimbex',
    ]) {
      expect(hits(variant)).toEqual([1])
    }
  })

  it('does not flag unrelated text', () => {
    expect(hits('MARTIN.G digital products, systems and experiences. מבעיה למוצר.')).toEqual([])
  })

  it('supports exact-only terms that skip collapsed matching', () => {
    const exact = createMatcher([`=${LATIN}`])
    expect(exact.matchText(LATIN)).toEqual([1])
    expect(exact.matchText('ZephyrquillNimbex')).toEqual([])
  })
})

describe('encodings', () => {
  it('finds terms behind JS unicode escapes, as bundlers emit Hebrew', () => {
    expect(hits(`const a="${jsEscape(HEBREW)}"`)).toEqual([2])
    expect(hits(`"\\u{5D2}\\u{5DC}\\u{5D6}\\u{5D1}\\u{5E8}\\u{5E0}\\u{5D5}\\u{5E3}"`)).toEqual([2])
    expect(hits('\\x5aephyrquill Nimbex')).toEqual([1])
  })

  it('finds terms behind HTML entities and percent-encoding', () => {
    const entities = [...HEBREW].map((c) => `&#x${c.codePointAt(0)!.toString(16)};`).join('')
    expect(hits(`<p>${entities}</p>`)).toEqual([2])
    const decimal = [...LATIN].map((c) => `&#${c.codePointAt(0)};`).join('')
    expect(hits(decimal)).toEqual([1])
    expect(hits(`/he/${encodeURIComponent(HEBREW)}`)).toEqual([2])
  })

  it('finds UTF-8 and UTF-16 strings inside binary files', () => {
    const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x00, 0x00, 0x0d])
    expect(bufferHits(Buffer.concat([header, Buffer.from(`tEXtTitle\0${LATIN}`, 'utf8')]))).toEqual(
      [1],
    )
    expect(bufferHits(Buffer.concat([header, Buffer.from(HEBREW, 'utf16le')]))).toEqual([2])
    const be = Buffer.from(LATIN, 'utf16le').swap16()
    expect(bufferHits(Buffer.concat([header, be]))).toEqual([1])
    expect(
      bufferHits(Buffer.concat([header, Buffer.from([0]), Buffer.from(LATIN, 'utf16le')])),
    ).toEqual([1])
  })
})

describe('redaction', () => {
  it('redacts only the matching path segments', () => {
    expect(redactPath('public/zephyrquill-nimbex/cover.png', matcher)).toBe(
      'public/[redacted]/cover.png',
    )
  })
})

describe('CLI', () => {
  it('reports findings in paths and contents without printing any term', () => {
    const root = tempDir()
    mkdirSync(path.join(root, 'zephyrquill_nimbex'))
    writeFileSync(path.join(root, 'zephyrquill_nimbex', 'a.txt'), 'clean')
    writeFileSync(path.join(root, 'chunk.js'), `var t="${jsEscape(HEBREW)}";`)
    const result = cli(['dir', '.'], { cwd: root, env: { [TERMS_VAR]: B64 } })
    expect(result.status).toBe(1)
    expect(result.output).toContain('term #1 in path "[redacted]/a.txt"')
    expect(result.output).toContain('term #2 in content of "chunk.js"')
    expectNoTermInOutput(result.output)
  })

  it('passes on clean input', () => {
    const root = tempDir()
    writeFileSync(path.join(root, 'index.html'), '<h1>MARTIN.G</h1>')
    const result = cli(['dir', '.'], { cwd: root, env: { [TERMS_VAR]: B64 } })
    expect(result.status).toBe(0)
    expect(result.output).toContain('clean, 2 term(s)')
  })

  it('exits 2 when unconfigured in CI', () => {
    const result = cli(['dir', '.'], { cwd: tempDir(), env: { CI: 'true' } })
    expect(result.status).toBe(2)
  })

  it('scans Next build output and public assets, skipping the build cache', () => {
    const root = tempDir()
    mkdirSync(path.join(root, '.next', 'server', 'app'), { recursive: true })
    mkdirSync(path.join(root, '.next', 'cache'), { recursive: true })
    mkdirSync(path.join(root, 'public'))
    writeFileSync(path.join(root, '.next', 'server', 'app', 'en.html'), '<h1>MARTIN.G</h1>')
    writeFileSync(path.join(root, '.next', 'cache', 'x.bin'), LATIN)
    const clean = cli(['build'], { cwd: root, env: { [TERMS_VAR]: B64 } })
    expect(clean.status).toBe(0)
    writeFileSync(path.join(root, 'public', 'meta.svg'), `<svg><title>${LATIN}</title></svg>`)
    const leaked = cli(['build'], { cwd: root, env: { [TERMS_VAR]: B64 } })
    expect(leaked.status).toBe(1)
    expect(leaked.output).toContain('content of "public/meta.svg"')
    expectNoTermInOutput(leaked.output)
  })

  it('checks commit messages', () => {
    const root = tempDir()
    writeFileSync(path.join(root, 'MSG'), `Add work for ${LATIN}\n`)
    const result = cli(['commit-msg', 'MSG'], { cwd: root, env: { [TERMS_VAR]: B64 } })
    expect(result.status).toBe(1)
    expect(result.output).toContain('term #1 in commit message')
    expectNoTermInOutput(result.output)
  })

  it('checks staged content, staged paths and the branch name', () => {
    const repo = tempRepo()
    git(repo, 'checkout', '-q', '-b', 'feature/zephyrquill-nimbex')
    writeFileSync(path.join(repo, `${HEBREW}.txt`), 'clean')
    writeFileSync(path.join(repo, 'b.txt'), LATIN)
    git(repo, 'add', '.')
    const result = cli(['staged'], { cwd: repo, env: { [TERMS_VAR]: B64 } })
    expect(result.status).toBe(1)
    expect(result.output).toContain('term #2 in path "[redacted]"')
    expect(result.output).toContain('term #1 in content of "b.txt"')
    expect(result.output).toContain('term #1 in current branch name')
    expectNoTermInOutput(result.output)
  })

  it('checks every object in history, including removed files and commit messages', () => {
    const repo = tempRepo()
    writeFileSync(path.join(repo, 'secret.txt'), `x ${HEBREW} x`)
    git(repo, 'add', '.')
    git(repo, 'commit', '-q', '-m', 'add file')
    git(repo, 'rm', '-q', 'secret.txt')
    git(repo, 'commit', '-q', '-m', `remove ${LATIN}`)
    const result = cli(['history'], { cwd: repo, env: { [TERMS_VAR]: B64 } })
    expect(result.status).toBe(1)
    expect(result.output).toMatch(/term #2 in blob [0-9a-f]{40}/)
    expect(result.output).toMatch(/term #1 in commit [0-9a-f]{40}/)
    expectNoTermInOutput(result.output)
  })

  it('checks ref names and CI branch variables', () => {
    const repo = tempRepo()
    git(repo, 'branch', 'zephyrquill-nimbex')
    const result = cli(['refs'], { cwd: repo, env: { [TERMS_VAR]: B64, GITHUB_HEAD_REF: HEBREW } })
    expect(result.status).toBe(1)
    expect(result.output).toContain('term #1 in ref name')
    expect(result.output).toContain('term #2 in CI variable GITHUB_HEAD_REF')
    expectNoTermInOutput(result.output)
  })

  it('checks named environment values such as pull request titles', () => {
    const result = cli(['env', 'PR_TITLE'], {
      env: { [TERMS_VAR]: B64, PR_TITLE: `Update ${LATIN.toLowerCase()}` },
    })
    expect(result.status).toBe(1)
    expect(result.output).toContain('term #1 in environment value PR_TITLE')
  })
})
