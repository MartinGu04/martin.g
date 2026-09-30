/*
 * Binary scanning regression tests (Windows heap-corruption fix). Arbitrary binary content
 * must be matched byte-level: never decoded to strings, never cloned or byte-swapped, safe
 * for odd lengths and unaligned views, and bounded in memory for large files.
 * Every term here is a SYNTHETIC canary.
 */
import { randomBytes } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  containsPattern,
  createMatcher,
  encodePattern,
  isTextContent,
  redactPath,
  scanFile,
  termForms,
} from '../../scripts/leak-check.mjs'
import { B64, HEBREW, LATIN, TERMS, cli, tempDir } from '../support/leak-check'
import { TERMS_VAR } from '../../scripts/leak-check.mjs'

const matcher = createMatcher(TERMS)
const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00])

const utf16be = (s: string) => {
  const le = Buffer.from(s, 'utf16le')
  const be = Buffer.alloc(le.length)
  for (let i = 0; i < le.length; i += 2) {
    be[i] = le[i + 1]!
    be[i + 1] = le[i]!
  }
  return be
}

/** A Buffer view at an odd byte offset of a larger allocation (unaligned for UTF-16). */
function unalignedView(content: Buffer, offset = 3) {
  const backing = new ArrayBuffer(content.length + offset + 1)
  const view = Buffer.from(backing, offset, content.length)
  content.copy(view)
  return view
}

afterEach(() => vi.restoreAllMocks())

describe('classification', () => {
  it('treats valid UTF-8 without NUL bytes as text', () => {
    expect(isTextContent(Buffer.from('<p>MARTIN.G</p>'))).toBe(true)
    expect(isTextContent(Buffer.from('מבעיה למוצר\r\n'))).toBe(true)
    expect(isTextContent(Buffer.alloc(0))).toBe(true)
  })

  it('treats NUL bytes and invalid UTF-8 as binary', () => {
    expect(isTextContent(PNG_HEADER)).toBe(false)
    expect(isTextContent(Buffer.from([0x61, 0xff, 0x62]))).toBe(false)
    expect(isTextContent(Buffer.from(HEBREW, 'utf16le'))).toBe(false)
  })
})

describe('byte patterns', () => {
  it('cover composed, decomposed, niqqud-free, final-letter, case and separator forms', () => {
    const latin = termForms(LATIN, { separators: true })
    for (const form of [
      'Zephyrquill Nimbex',
      'zephyrquillnimbex',
      'ZEPHYRQUILL-NIMBEX',
      'zephyrquill_nimbex',
      'zephyrquill.nimbex',
    ]) {
      expect(latin).toContain(form)
    }
    expect(termForms(HEBREW, { separators: true })).toContain('גלזברנופ')
    expect(termForms(LATIN, { separators: false })).not.toContain('zephyrquillnimbex')
  })

  it('fold ASCII case only on ASCII letter bytes', () => {
    const le = encodePattern('Ab', 'utf16le')
    expect([...le.bytes]).toEqual([0x41, 0x00, 0x62, 0x00])
    expect([...le.alt]).toEqual([0x61, 0x00, 0x42, 0x00])
    const be = encodePattern('ג', 'utf16be')
    expect([...be.bytes]).toEqual([0x05, 0xd2])
    expect([...be.alt]).toEqual([0x05, 0xd2])
  })

  it('find patterns at the start, at the very end and at odd offsets', () => {
    const pattern = encodePattern('nimbex', 'utf8')
    expect(containsPattern(Buffer.from('nimbex'), pattern)).toBe(true)
    expect(containsPattern(Buffer.from('xxNIMBEX'), pattern)).toBe(true)
    expect(containsPattern(Buffer.from('xnimbe'), pattern)).toBe(false)
    expect(containsPattern(Buffer.alloc(0), pattern)).toBe(false)
  })
})

describe('binary content', () => {
  it('matches UTF-8, UTF-16LE and UTF-16BE terms inside binaries', () => {
    expect(matcher.matchBuffer(Buffer.concat([PNG_HEADER, Buffer.from(`tEXt${LATIN}`)]))).toEqual([
      1,
    ])
    expect(
      matcher.matchBuffer(Buffer.concat([PNG_HEADER, Buffer.from(HEBREW, 'utf16le')])),
    ).toEqual([2])
    expect(matcher.matchBuffer(Buffer.concat([PNG_HEADER, utf16be(HEBREW)]))).toEqual([2])
    expect(matcher.matchBuffer(Buffer.concat([PNG_HEADER, utf16be('zephyrquillNimbex')]))).toEqual([
      1,
    ])
  })

  it('matches percent-encoded, JS-escaped and entity-encoded terms inside binaries', () => {
    const backslash = String.fromCharCode(0x5c)
    const units = [...HEBREW].map((c) => c.charCodeAt(0))
    const encodings = [
      `/he/${encodeURIComponent(HEBREW).toLowerCase()}`,
      units.map((u) => `${backslash}u${u.toString(16).toUpperCase().padStart(4, '0')}`).join(''),
      units.map((u) => `&#x${u.toString(16)};`).join(''),
      units.map((u) => `&#${u};`).join(''),
    ]
    for (const encoded of encodings) {
      const binary = Buffer.concat([PNG_HEADER, Buffer.from(encoded, 'ascii')])
      expect(matcher.matchBuffer(binary), encoded.slice(0, 12)).toEqual([2])
    }
  })

  it('matches Hebrew followed by a suffix (final letter written as a regular letter)', () => {
    const suffixed = Buffer.concat([PNG_HEADER, Buffer.from(`${HEBREW.slice(0, -1)}פים`)])
    expect(matcher.matchBuffer(suffixed)).toEqual([2])
  })

  it('handles odd lengths and unaligned views without decoding', () => {
    const payload = Buffer.concat([
      PNG_HEADER,
      Buffer.from([0x01]),
      Buffer.from(HEBREW, 'utf16le'),
      Buffer.from([0x02, 0x03]),
    ])
    expect(payload.length % 2).toBe(1)
    const view = unalignedView(payload)
    expect(view.byteOffset % 2).toBe(1)
    expect(matcher.matchBuffer(view)).toEqual([2])
    expect(
      matcher.matchBuffer(
        unalignedView(Buffer.concat([PNG_HEADER, utf16be(LATIN), Buffer.from([7])])),
      ),
    ).toEqual([1])
  })

  it('never converts, clones or byte-swaps binary content', () => {
    const content = Buffer.concat([
      randomBytes(256 * 1024),
      Buffer.from([0]),
      Buffer.from(HEBREW, 'utf16le'),
    ])
    const toString = vi.spyOn(Buffer.prototype, 'toString')
    const swap16 = vi.spyOn(Buffer.prototype, 'swap16')
    const from = vi.spyOn(Buffer, 'from')
    expect(matcher.matchBuffer(content)).toEqual([2])
    expect(toString).not.toHaveBeenCalled()
    expect(swap16).not.toHaveBeenCalled()
    expect(from).not.toHaveBeenCalled()
  })

  it('survives degenerate binaries', () => {
    const lowSurrogates = Buffer.alloc(4096)
    for (let i = 0; i < lowSurrogates.length; i += 2) lowSurrogates[i + 1] = 0xdc
    for (const content of [
      Buffer.from([0]),
      Buffer.alloc(4097),
      Buffer.alloc(4097, 0xff),
      lowSurrogates,
      unalignedView(Buffer.alloc(9, 0xd8), 1),
    ]) {
      expect(matcher.matchBuffer(content)).toEqual([])
    }
  })

  it('does not flag random binary noise', () => {
    expect(
      matcher.matchBuffer(Buffer.concat([Buffer.from([0]), randomBytes(2 * 1024 * 1024)])),
    ).toEqual([])
  })
})

describe('large files', () => {
  it('find matches across chunk boundaries with a small chunk size', () => {
    const dir = tempDir()
    const file = path.join(dir, 'blob.bin')
    const term = Buffer.from(HEBREW, 'utf16le')
    for (const offset of [0, 60, 63, 64, 100, 127]) {
      const content = Buffer.alloc(200, 0)
      term.copy(content, offset)
      writeFileSync(file, content)
      expect(scanFile(file, matcher, { chunkBytes: 64, textLimit: 0 }), `offset ${offset}`).toEqual(
        [2],
      )
    }
    const tail = Buffer.concat([Buffer.alloc(301, 0), utf16be(LATIN)])
    writeFileSync(file, tail)
    expect(scanFile(file, matcher, { chunkBytes: 64, textLimit: 0 })).toEqual([1])
    writeFileSync(file, Buffer.alloc(1000, 0))
    expect(scanFile(file, matcher, { chunkBytes: 64, textLimit: 0 })).toEqual([])
  })

  it('scan a 64 MB binary in build mode within a 64 MB JS heap', () => {
    const root = tempDir()
    mkdirSync(path.join(root, '.next', 'server'), { recursive: true })
    const big = path.join(root, '.next', 'server', 'blob.bin')
    const content = randomBytes(64 * 1024 * 1024)
    writeFileSync(big, content)
    const nodeArgs = ['--max-old-space-size=64']
    const clean = cli(['build'], { cwd: root, env: { [TERMS_VAR]: B64 }, nodeArgs })
    expect(clean.output).toContain('clean')
    expect(clean.status).toBe(0)

    utf16be(LATIN).copy(content, content.length - 100)
    writeFileSync(big, content)
    const leaked = cli(['build'], { cwd: root, env: { [TERMS_VAR]: B64 }, nodeArgs })
    expect(leaked.status).toBe(1)
    expect(leaked.output).toContain('term #1 in content of ".next/server/blob.bin"')
  }, 120_000)
})

describe('build mode scope', () => {
  it('skips only never-deployed caches and scans the rest of .next, including .next/dev', () => {
    const root = tempDir()
    const write = (rel: string, data: string | Buffer) => {
      mkdirSync(path.dirname(path.join(root, rel)), { recursive: true })
      writeFileSync(path.join(root, rel), data)
    }
    write('.next/server/app/en.html', '<h1>MARTIN.G</h1>')
    write(
      '.next/cache/turbopack/00000001.sst',
      Buffer.concat([Buffer.from([0]), Buffer.from(LATIN)]),
    )
    write(
      '.next/dev/cache/turbopack/00000001.sst',
      Buffer.concat([Buffer.from([0]), Buffer.from(LATIN)]),
    )
    expect(cli(['build'], { cwd: root, env: { [TERMS_VAR]: B64 } }).status).toBe(0)

    write('.next/dev/server/chunks/page.js', `var t="${LATIN}"`)
    const result = cli(['build'], { cwd: root, env: { [TERMS_VAR]: B64 } })
    expect(result.status).toBe(1)
    expect(result.output).toContain('.next/dev/server/chunks/page.js')
    expect(result.output).not.toContain('sst')
  })

  it('reads CRLF text and reports forward-slash paths for Windows-style input', () => {
    const root = tempDir()
    mkdirSync(path.join(root, '.next', 'static'), { recursive: true })
    writeFileSync(path.join(root, '.next', 'static', 'a.css'), `a{}\r\n/* ${HEBREW} */\r\n`)
    const result = cli(['build'], { cwd: root, env: { [TERMS_VAR]: B64 } })
    expect(result.status).toBe(1)
    expect(result.output).toContain('content of ".next/static/a.css"')
    expect(redactPath('.next\\server\\zephyrquill-nimbex\\a.js', matcher)).toBe(
      '.next/server/[redacted]/a.js',
    )
  })
})

describe('source hygiene', () => {
  it('the scanner never decodes scanned buffers as UTF-16 or byte-swaps them', () => {
    const source = readFileSync(new URL('../../scripts/leak-check.mjs', import.meta.url), 'utf8')
    expect(source).not.toMatch(/\.swap16\(/)
    expect(source).not.toMatch(/toString\(\s*['"](?:utf16le|ucs2|utf-16le|latin1|binary)['"]/)
  })
})
