#!/usr/bin/env node
/**
 * Confidential leak check.
 *
 * The blocklist is NEVER stored in this repository. It is read only from the
 * LEAK_CHECK_TERMS_B64 environment variable (base64 of newline-separated UTF-8 terms),
 * or from that variable inside a gitignored .env.local. Sources: local ignored config,
 * GitHub Actions secrets and Vercel Sensitive environment variables.
 *
 * Findings never print a term or the matched text: only the term's position in the list
 * and a location, with any path segment that matches redacted.
 *
 * Modes:
 *   files               tracked + untracked (not ignored) files: contents and paths
 *   staged              staged blobs and paths, plus the current branch name (pre-commit)
 *   commit-msg <file>   a commit message (commit-msg hook)
 *   push                refs from stdin (pre-push) plus full history
 *   history             every object in the Git database (blobs, trees, commit
 *                       messages, tags) plus all ref and branch names
 *   refs                ref and branch names only (includes CI branch variables)
 *   env <VAR...>        values of the named environment variables (e.g. PR title/body)
 *   build               Next build output (.next, excluding the never-deployed caches
 *                       .next/cache and .next/dev/cache), public/, .vercel/output
 *   dir <path...>       any directories or files
 *   encode              read terms from stdin, print the base64 value to configure
 *
 * Terms: one per line; blank lines and lines starting with # are ignored. By default a
 * term also matches with separators removed (so "foo bar" catches "foo-bar", "foo_bar"
 * and "FooBar"). Prefix a term with "=" to disable that for a term that causes false
 * positives. Terms must have at least 3 characters.
 *
 * Content: text-like content (valid UTF-8 without NUL bytes: HTML, JS, CSS, JSON, RSC,
 * manifests, SVG, commit messages) is normalized and decoded (JS escapes, HTML entities,
 * percent-encoding) before matching. Arbitrary binary content is never converted to a
 * string: each term is pre-encoded as UTF-8, UTF-16LE and UTF-16BE byte patterns (with
 * composed/decomposed, niqqud-free, final-letter, case and separator variants) and matched
 * byte-level. Files above 32 MB are matched byte-level in overlapping chunks.
 *
 * Exit codes: 0 clean, 1 findings, 2 configuration error.
 */
import { isUtf8 } from 'node:buffer'
import { execFileSync, spawnSync } from 'node:child_process'
import {
  closeSync,
  existsSync,
  openSync,
  readFileSync,
  readSync,
  readdirSync,
  statSync,
} from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

export const TERMS_VAR = 'LEAK_CHECK_TERMS_B64'
const MIN_TERM_LENGTH = 3
const MIN_COLLAPSED_LENGTH = 4
// Files up to this size are classified and, if text-like, fully normalized and decoded.
const TEXT_SCAN_LIMIT_BYTES = 32 * 1024 * 1024
// Larger files are matched byte-level in chunks of this size.
const CHUNK_BYTES = 8 * 1024 * 1024

/* ------------------------------------------------------------------ */
/* Configuration                                                       */
/* ------------------------------------------------------------------ */

export class ConfigError extends Error {}

/** @param {string} b64 @returns {string[]} */
export function decodeTerms(b64) {
  const compact = b64.replace(/\s+/g, '')
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(compact) || compact.length % 4 !== 0) {
    throw new ConfigError(`${TERMS_VAR} is not valid base64.`)
  }
  const terms = Buffer.from(compact, 'base64')
    .toString('utf8')
    .split(/\r?\n/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && !t.startsWith('#'))
  terms.forEach((t, i) => {
    const bare = t.startsWith('=') ? t.slice(1) : t
    if (normalize(bare).length < MIN_TERM_LENGTH) {
      throw new ConfigError(`Term #${i + 1} is shorter than ${MIN_TERM_LENGTH} characters.`)
    }
  })
  return terms
}

/** Reads only the blocklist variable from a dotenv-style file. */
function readVarFromDotenv(file) {
  if (!existsSync(file)) return undefined
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(new RegExp(`^\\s*(?:export\\s+)?${TERMS_VAR}\\s*=\\s*(.*)\\s*$`))
    if (m) return m[1].replace(/^(['"])(.*)\1$/, '$2')
  }
  return undefined
}

function isCi(env) {
  return Boolean(env.CI || env.VERCEL || env.GITHUB_ACTIONS)
}

/**
 * Returns the configured terms, or null when unconfigured and explicitly allowed locally.
 * Fails closed in CI and on Vercel.
 * @param {{ env?: Record<string, string | undefined>, root?: string }} [options]
 * @returns {string[] | null}
 */
export function loadTerms({ env = process.env, root = process.cwd() } = {}) {
  const raw = env[TERMS_VAR] || readVarFromDotenv(path.join(root, '.env.local'))
  const terms = raw ? decodeTerms(raw) : []
  if (terms.length > 0) return terms
  if (!isCi(env) && env.LEAK_CHECK_ALLOW_UNCONFIGURED === '1') return null
  throw new ConfigError(
    isCi(env)
      ? `${TERMS_VAR} is not configured. CI and Vercel builds fail closed without it.`
      : `${TERMS_VAR} is not configured. Add it to .env.local (gitignored) or your shell. ` +
          'To skip explicitly for this command only, set LEAK_CHECK_ALLOW_UNCONFIGURED=1.',
  )
}

/* ------------------------------------------------------------------ */
/* Normalization and decoding                                          */
/* ------------------------------------------------------------------ */

const HEBREW_FINALS = { ך: 'כ', ם: 'מ', ן: 'נ', ף: 'פ', ץ: 'צ' }
// Zero-width and bidi control characters can split a term invisibly. Built from code points
// so this source file never contains the invisible characters themselves.
const INVISIBLE_RANGES = [
  [0xad, 0xad],
  [0x200b, 0x200f],
  [0x202a, 0x202e],
  [0x2060, 0x2064],
  [0x2066, 0x2069],
  [0xfeff, 0xfeff],
]
const INVISIBLES = new RegExp(
  `[${INVISIBLE_RANGES.map(([a, b]) => `${String.fromCodePoint(a)}-${String.fromCodePoint(b)}`).join('')}]`,
  'gu',
)

/** Case, compatibility forms, diacritics, niqqud and Hebrew final letters are ignored. */
export function normalize(text) {
  return text
    .replace(INVISIBLES, '')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[ךםןףץ]/g, (c) => HEBREW_FINALS[c])
}

/** Normalized text with every separator removed. */
export function collapse(text) {
  return normalize(text).replace(/[^\p{L}\p{N}]+/gu, '')
}

export function decodeJsEscapes(text) {
  return text.replace(
    /\\u\{([0-9a-fA-F]{1,6})\}|\\u([0-9a-fA-F]{4})|\\x([0-9a-fA-F]{2})/g,
    (match, braced, u4, x2) => {
      const cp = Number.parseInt(braced ?? u4 ?? x2, 16)
      return cp <= 0x10ffff ? String.fromCodePoint(cp) : match
    },
  )
}

const NAMED_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

export function decodeHtmlEntities(text) {
  return text.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (match, body) => {
    if (body[0] === '#') {
      const cp =
        body[1] === 'x' || body[1] === 'X'
          ? Number.parseInt(body.slice(2), 16)
          : Number.parseInt(body.slice(1), 10)
      return cp <= 0x10ffff ? String.fromCodePoint(cp) : match
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? match
  })
}

export function decodePercent(text) {
  return text.replace(/(?:%[0-9a-fA-F]{2})+/g, (run) => {
    try {
      return decodeURIComponent(run)
    } catch {
      return run
    }
  })
}

/** Applies all decoders until the text stops changing (handles nested encodings). */
export function decodeAll(text) {
  let current = text
  for (let i = 0; i < 4; i++) {
    const next = decodePercent(decodeHtmlEntities(decodeJsEscapes(current)))
    if (next === current) break
    current = next
  }
  return current
}

/* ------------------------------------------------------------------ */
/* Content classification                                              */
/* ------------------------------------------------------------------ */

/**
 * Text-like content (HTML, JS, CSS, JSON, RSC payloads, manifests, SVG, commit messages...)
 * is valid UTF-8 without NUL bytes. Both checks run natively on the bytes, without decoding.
 * Everything else is treated as arbitrary binary and is never converted to a string.
 */
export function isTextContent(buffer) {
  return !buffer.includes(0) && isUtf8(buffer)
}

/* ------------------------------------------------------------------ */
/* Byte-level patterns for binary content                              */
/* ------------------------------------------------------------------ */

const SEPARATOR_JOINS = ['', ' ', '-', '_', '.']
const utf8Encoder = new TextEncoder()

const isAsciiLetter = (unit) => (unit >= 0x41 && unit <= 0x5a) || (unit >= 0x61 && unit <= 0x7a)
const stripMarks = (s) => s.normalize('NFKD').replace(/\p{M}/gu, '').normalize('NFC')
const regularFinals = (s) => s.replace(/[ךםןףץ]/g, (c) => HEBREW_FINALS[c])

/**
 * Surface forms a term can take inside binary content: composed and decomposed Unicode,
 * without diacritics or niqqud, Hebrew final letters as regular letters (so suffixed
 * forms match), upper and lower case, and, unless exact-only, words joined by common
 * separators. ASCII case is also folded during matching, which covers camelCase.
 */
export function termForms(term, { separators }) {
  const forms = new Set()
  for (const base of [term.normalize('NFC'), term.normalize('NFD'), stripMarks(term)]) {
    for (const form of [base, regularFinals(base)]) {
      forms.add(form)
      forms.add(form.toLowerCase())
      forms.add(form.toUpperCase())
    }
  }
  if (separators) {
    for (const form of [...forms]) {
      const words = form.split(/[^\p{L}\p{N}\p{M}]+/u).filter(Boolean)
      if (words.length > 1) for (const join of SEPARATOR_JOINS) forms.add(words.join(join))
    }
  }
  return [...forms].filter((f) => f.length > 0)
}

const BACKSLASH = String.fromCharCode(0x5c)
const hex = (n, width) => n.toString(16).padStart(width, '0')

/**
 * Escaped spellings of a form that can appear inside binaries (URLs in metadata, embedded
 * scripts or markup): percent-encoding, JS unicode escapes and HTML numeric entities for
 * non-ASCII characters. Matched as ASCII bytes; hex case is folded during matching.
 */
export function escapedForms(form) {
  const escape = (fn) => [...form].map((ch) => (ch.codePointAt(0) > 0x7f ? fn(ch) : ch)).join('')
  const forms = new Set([
    encodeURIComponent(form),
    // Every UTF-16 unit is escaped, so characters outside the BMP become surrogate pairs.
    escape((ch) =>
      Array.from({ length: ch.length }, (_, k) => `${BACKSLASH}u${hex(ch.charCodeAt(k), 4)}`).join(
        '',
      ),
    ),
    escape((ch) => `&#x${hex(ch.codePointAt(0), 1)};`),
    escape((ch) => `&#${ch.codePointAt(0)};`),
  ])
  forms.delete(form)
  return [...forms]
}

/**
 * Encodes one short term form as bytes, with an alternate byte per position for ASCII
 * letters (case folding). Only the term is encoded here; scanned content never is.
 * @param {string} form @param {'utf8' | 'utf16le' | 'utf16be'} encoding
 */
export function encodePattern(form, encoding) {
  /** @type {[number, boolean][]} */
  const units = []
  if (encoding === 'utf8') {
    for (const ch of form) {
      const bytes = utf8Encoder.encode(ch)
      const fold = bytes.length === 1 && isAsciiLetter(bytes[0])
      for (const b of bytes) units.push([b, fold])
    }
  } else {
    for (let i = 0; i < form.length; i++) {
      const unit = form.charCodeAt(i)
      const low = /** @type {[number, boolean]} */ ([unit & 0xff, isAsciiLetter(unit)])
      const high = /** @type {[number, boolean]} */ ([unit >> 8, false])
      if (encoding === 'utf16le') units.push(low, high)
      else units.push(high, low)
    }
  }
  return {
    bytes: Uint8Array.from(units, ([b]) => b),
    alt: Uint8Array.from(units, ([b, fold]) => (fold ? b ^ 0x20 : b)),
  }
}

/**
 * Searches bytes for a pattern, with ASCII case folding. Read-only: the haystack is never
 * decoded, copied or mutated, and alignment does not matter. Candidate positions come from
 * native single-byte indexOf, each advanced at most once past every position.
 * @param {Uint8Array} haystack @param {{ bytes: Uint8Array, alt: Uint8Array }} pattern
 */
export function containsPattern(haystack, { bytes, alt }) {
  const m = bytes.length
  const last = haystack.length - m
  if (m === 0 || last < 0) return false
  const first = bytes[0]
  const firstAlt = alt[0]
  let nextFirst = haystack.indexOf(first, 0)
  let nextAlt = firstAlt === first ? -1 : haystack.indexOf(firstAlt, 0)
  for (;;) {
    const i = nextFirst === -1 ? nextAlt : nextAlt === -1 ? nextFirst : Math.min(nextFirst, nextAlt)
    if (i === -1 || i > last) return false
    let j = 1
    while (j < m && (haystack[i + j] === bytes[j] || haystack[i + j] === alt[j])) j++
    if (j === m) return true
    if (i === nextFirst) nextFirst = haystack.indexOf(first, i + 1)
    if (i === nextAlt) nextAlt = haystack.indexOf(firstAlt, i + 1)
  }
}

/* ------------------------------------------------------------------ */
/* Matching                                                            */
/* ------------------------------------------------------------------ */

/** @param {string[]} terms */
export function createMatcher(terms) {
  const prepared = terms.map((raw, i) => {
    const exactOnly = raw.startsWith('=')
    const term = exactOnly ? raw.slice(1) : raw
    const collapsed = collapse(term)
    const separators = !exactOnly && collapsed.length >= MIN_COLLAPSED_LENGTH
    const seen = new Set()
    const patterns = []
    const addPattern = (pattern) => {
      const key = `${pattern.bytes.join(',')}|${pattern.alt.join(',')}`
      if (seen.has(key)) return
      seen.add(key)
      patterns.push(pattern)
    }
    for (const form of termForms(term, { separators })) {
      for (const encoding of /** @type {const} */ (['utf8', 'utf16le', 'utf16be'])) {
        addPattern(encodePattern(form, encoding))
      }
      for (const escaped of escapedForms(form)) addPattern(encodePattern(escaped, 'utf8'))
    }
    return {
      id: i + 1,
      normalized: normalize(term),
      collapsed: separators ? collapsed : null,
      patterns,
    }
  })
  const needsCollapse = prepared.some((p) => p.collapsed)
  const maxPatternLength = Math.max(
    1,
    ...prepared.flatMap((p) => p.patterns.map((pattern) => pattern.bytes.length)),
  )

  /** Matches one already-decoded view. */
  function matchView(text) {
    const normalized = normalize(text)
    const collapsedText = needsCollapse ? normalized.replace(/[^\p{L}\p{N}]+/gu, '') : ''
    const hits = []
    for (const p of prepared) {
      if (
        normalized.includes(p.normalized) ||
        (p.collapsed && collapsedText.includes(p.collapsed))
      ) {
        hits.push(p.id)
      }
    }
    return hits
  }

  const union = (views) => {
    const hits = new Set()
    for (const view of views) for (const id of matchView(view)) hits.add(id)
    return [...hits].sort((a, b) => a - b)
  }

  /** Matches text as written and after decoding escapes, entities and percent-encoding. */
  function matchText(text) {
    const decoded = decodeAll(text)
    return union(decoded === text ? [text] : [text, decoded])
  }

  /** Byte-level matching for arbitrary binary content (UTF-8, UTF-16LE, UTF-16BE). */
  function matchBytes(bytes) {
    return prepared
      .filter((p) => p.patterns.some((pattern) => containsPattern(bytes, pattern)))
      .map((p) => p.id)
  }

  /**
   * Text-like content goes through normalization and escape/entity/percent decoding.
   * Arbitrary binary content goes through byte-level matching only.
   * @param {Buffer} buffer
   */
  function matchBuffer(buffer) {
    return isTextContent(buffer) ? matchText(buffer.toString('utf8')) : matchBytes(buffer)
  }

  return { matchText, matchBytes, matchBuffer, maxPatternLength }
}

/**
 * Scans a file with bounded memory. Files up to `textLimit` are read whole and classified;
 * larger files are matched byte-level in overlapping chunks through one reused buffer, so
 * a match spanning a chunk boundary is still found.
 */
export function scanFile(
  abs,
  matcher,
  { chunkBytes = CHUNK_BYTES, textLimit = TEXT_SCAN_LIMIT_BYTES } = {},
) {
  const { size } = statSync(abs)
  if (size <= textLimit) return matcher.matchBuffer(readFileSync(abs))
  const overlap = matcher.maxPatternLength - 1
  const buffer = Buffer.allocUnsafe(chunkBytes + overlap)
  const hits = new Set()
  const fd = openSync(abs, 'r')
  try {
    let carried = 0
    let position = 0
    while (position < size) {
      const read = readSync(fd, buffer, carried, chunkBytes, position)
      if (read === 0) break
      position += read
      const window = buffer.subarray(0, carried + read)
      for (const id of matcher.matchBytes(window)) hits.add(id)
      carried = Math.min(overlap, window.length)
      buffer.copyWithin(0, window.length - carried, window.length)
    }
  } finally {
    closeSync(fd)
  }
  return [...hits].sort((a, b) => a - b)
}

/** Replaces any path segment that matches a term. */
export function redactPath(relPath, matcher) {
  return relPath
    .split(/[\\/]/)
    .map((segment) => (matcher.matchText(segment).length > 0 ? '[redacted]' : segment))
    .join('/')
}

/* ------------------------------------------------------------------ */
/* Scanners                                                            */
/* ------------------------------------------------------------------ */

class Findings {
  constructor(matcher) {
    this.matcher = matcher
    this.items = []
  }

  add(ids, where) {
    for (const id of ids) this.items.push(`term #${id} in ${where}`)
  }

  /** Records path matches and, when given, the term ids found in the file's content. */
  file(relPath, contentIds) {
    const safePath = redactPath(relPath, this.matcher)
    this.add(this.matcher.matchText(relPath), `path "${safePath}"`)
    if (contentIds) this.add(contentIds, `content of "${safePath}"`)
  }

  text(label, value) {
    this.add(this.matcher.matchText(value), label)
  }
}

function git(args, options = {}) {
  return execFileSync('git', args, { maxBuffer: 1024 * 1024 * 1024, ...options })
}

function gitLines(args) {
  return git(args).toString('utf8').split('\0').join('\n').split('\n').filter(Boolean)
}

function walk(absDir, visit, skip = () => false) {
  for (const entry of readdirSync(absDir, { withFileTypes: true })) {
    const abs = path.join(absDir, entry.name)
    if (skip(abs)) continue
    if (entry.isDirectory()) walk(abs, visit, skip)
    else if (entry.isFile()) visit(abs)
  }
}

export function scanPaths(findings, root, targets, skip) {
  for (const target of targets) {
    const absTarget = path.resolve(root, target)
    if (!existsSync(absTarget)) continue
    const visit = (abs) => findings.file(path.relative(root, abs), scanFile(abs, findings.matcher))
    if (statSync(absTarget).isDirectory()) walk(absTarget, visit, skip)
    else visit(absTarget)
  }
}

function scanWorkingTree(findings, root) {
  const files = gitLines(['ls-files', '-z', '--cached', '--others', '--exclude-standard'])
  for (const rel of files) {
    const abs = path.join(root, rel)
    const isFile = existsSync(abs) && statSync(abs).isFile()
    findings.file(rel, isFile ? scanFile(abs, findings.matcher) : undefined)
  }
}

function scanBranchName(findings) {
  const result = spawnSync('git', ['symbolic-ref', '--quiet', '--short', 'HEAD'])
  if (result.status === 0)
    findings.text('current branch name', result.stdout.toString('utf8').trim())
}

function scanStaged(findings) {
  const staged = gitLines(['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR'])
  for (const rel of staged)
    findings.file(rel, findings.matcher.matchBuffer(git(['show', `:${rel}`])))
  scanBranchName(findings)
}

function scanRefs(findings, env) {
  const refs = gitLines(['for-each-ref', '--format=%(refname)'])
  refs.forEach((ref, i) => findings.text(`ref name #${i + 1}`, ref))
  for (const name of [
    'GITHUB_HEAD_REF',
    'GITHUB_BASE_REF',
    'GITHUB_REF_NAME',
    'VERCEL_GIT_COMMIT_REF',
  ]) {
    if (env[name]) findings.text(`CI variable ${name}`, env[name])
  }
  scanBranchName(findings)
}

/** Every object in the Git database: blobs, trees (file names), commits (messages), tags. */
function scanHistory(findings) {
  const out = git(['cat-file', '--batch-all-objects', '--batch'])
  let offset = 0
  let count = 0
  while (offset < out.length) {
    const newline = out.indexOf(10, offset)
    if (newline === -1) break
    const header = out.subarray(offset, newline).toString('utf8')
    const [sha, type, sizeText] = header.split(' ')
    const size = Number.parseInt(sizeText ?? '', 10)
    if (!sha || !type || !Number.isFinite(size)) break
    const body = out.subarray(newline + 1, newline + 1 + size)
    const ids = findings.matcher.matchBuffer(body)
    if (ids.length > 0) {
      const hint = type === 'blob' ? ` (locate with: git log --all --find-object=${sha})` : ''
      findings.add(ids, `${type} ${sha}${hint}`)
    }
    offset = newline + 1 + size + 1
    count++
  }
  return count
}

function scanStdin(findings, label) {
  const input = readFileSync(0, 'utf8')
  input.split('\n').forEach((line, i) => line && findings.text(`${label} line ${i + 1}`, line))
}

/* ------------------------------------------------------------------ */
/* CLI                                                                 */
/* ------------------------------------------------------------------ */

/**
 * @param {string[]} argv
 * @param {{ env?: Record<string, string | undefined>, root?: string, log?: Console }} [options]
 */
export function run(argv, { env = process.env, root = process.cwd(), log = console } = {}) {
  const [mode, ...args] = argv

  if (mode === 'encode') {
    const input = readFileSync(0, 'utf8')
    const encoded = Buffer.from(input.trim() + '\n', 'utf8').toString('base64')
    decodeTerms(encoded)
    process.stdout.write(`${encoded}\n`)
    log.error(
      'Set this value only in .env.local, GitHub Actions secrets and Vercel Sensitive env vars.',
    )
    return 0
  }

  const modes = ['files', 'staged', 'commit-msg', 'push', 'history', 'refs', 'env', 'build', 'dir']
  if (!modes.includes(mode)) {
    log.error(`Usage: leak-check.mjs <${[...modes, 'encode'].join('|')}> [args]`)
    return 2
  }

  let terms
  try {
    terms = loadTerms({ env, root })
  } catch (error) {
    if (error instanceof ConfigError) {
      log.error(`leak-check: ${error.message}`)
      return 2
    }
    throw error
  }
  if (terms === null) {
    log.warn(
      `leak-check (${mode}): SKIPPED. ${TERMS_VAR} is not configured and LEAK_CHECK_ALLOW_UNCONFIGURED=1.`,
    )
    return 0
  }

  const findings = new Findings(createMatcher(terms))
  let detail = ''
  switch (mode) {
    case 'files':
      scanWorkingTree(findings, root)
      break
    case 'staged':
      scanStaged(findings)
      break
    case 'commit-msg':
      if (!args[0]) throw new ConfigError('commit-msg mode needs the message file path.')
      findings.text('commit message', readFileSync(args[0], 'utf8'))
      break
    case 'push':
      scanStdin(findings, 'pushed ref')
      scanRefs(findings, env)
      detail = `${scanHistory(findings)} objects`
      break
    case 'history':
      scanRefs(findings, env)
      detail = `${scanHistory(findings)} objects`
      break
    case 'refs':
      scanRefs(findings, env)
      break
    case 'env':
      for (const name of args) findings.text(`environment value ${name}`, env[name] ?? '')
      break
    case 'build': {
      const nextDir = path.join(root, '.next')
      if (!existsSync(nextDir)) {
        log.error('leak-check: .next does not exist. Run next build first.')
        return 2
      }
      // Local build caches are never deployed: Next's build cache and, since Next 16, the
      // separate `next dev` output's Turbopack database. Everything else under .next is
      // scanned, including the rest of .next/dev.
      const caches = new Set([path.join(nextDir, 'cache'), path.join(nextDir, 'dev', 'cache')])
      scanPaths(findings, root, ['.next', 'public', '.vercel/output'], (abs) => caches.has(abs))
      break
    }
    case 'dir':
      scanPaths(findings, root, args)
      break
  }

  if (findings.items.length > 0) {
    log.error(`leak-check (${mode}): ${findings.items.length} finding(s). Terms are never printed.`)
    for (const item of findings.items) log.error(`  ✖ ${item}`)
    log.error('If a confidential term was committed or pushed, treat it as disclosed.')
    return 1
  }
  log.log(
    `leak-check (${mode}): clean, ${terms.length} term(s) checked${detail ? `, ${detail}` : ''}.`,
  )
  return 0
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    process.exitCode = run(process.argv.slice(2))
  } catch (error) {
    console.error(`leak-check: ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 2
  }
}
