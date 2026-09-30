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
 *   build               Next build output (.next, excluding cache), public/, .vercel/output
 *   dir <path...>       any directories or files
 *   encode              read terms from stdin, print the base64 value to configure
 *
 * Terms: one per line; blank lines and lines starting with # are ignored. By default a
 * term also matches with separators removed (so "foo bar" catches "foo-bar", "foo_bar"
 * and "FooBar"). Prefix a term with "=" to disable that for a term that causes false
 * positives. Terms must have at least 3 characters.
 *
 * Exit codes: 0 clean, 1 findings, 2 configuration error.
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

export const TERMS_VAR = 'LEAK_CHECK_TERMS_B64'
const MIN_TERM_LENGTH = 3
const MIN_COLLAPSED_LENGTH = 4
const MAX_FILE_BYTES = 512 * 1024 * 1024

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
// Zero-width and bidi control characters can split a term invisibly.
const INVISIBLES = /[­​-‏‪-‮⁠-⁤⁦-⁩﻿]/g

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

function isBinary(buffer) {
  const sample = buffer.subarray(0, 8000)
  return sample.includes(0)
}

/** Text views of a buffer: UTF-8 (raw and decoded), plus UTF-16 for binaries. */
export function textViews(buffer) {
  const utf8 = buffer.toString('utf8')
  const views = [utf8]
  const decoded = decodeAll(utf8)
  if (decoded !== utf8) views.push(decoded)
  if (isBinary(buffer)) {
    views.push(buffer.toString('utf16le'))
    const swapped = Buffer.from(buffer.subarray(0, buffer.length - (buffer.length % 2)))
    swapped.swap16()
    views.push(swapped.toString('utf16le'))
    // Offset by one byte to catch UTF-16 strings starting at odd offsets.
    views.push(buffer.subarray(1).toString('utf16le'))
  }
  return views
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
    return {
      id: i + 1,
      normalized: normalize(term),
      collapsed: !exactOnly && collapsed.length >= MIN_COLLAPSED_LENGTH ? collapsed : null,
    }
  })
  const needsCollapse = prepared.some((p) => p.collapsed)

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

  /** @param {Buffer} buffer */
  function matchBuffer(buffer) {
    return union(textViews(buffer))
  }

  return { matchText, matchBuffer }
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

  /** Scans a path (as text) and optionally its content. */
  file(relPath, buffer) {
    const safePath = redactPath(relPath, this.matcher)
    this.add(this.matcher.matchText(relPath), `path "${safePath}"`)
    if (buffer) this.add(this.matcher.matchBuffer(buffer), `content of "${safePath}"`)
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

function readIfSmall(abs) {
  const stat = statSync(abs)
  if (!stat.isFile()) return undefined
  if (stat.size > MAX_FILE_BYTES) throw new ConfigError(`File too large to scan: ${abs}`)
  return readFileSync(abs)
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
    const visit = (abs) => findings.file(path.relative(root, abs), readIfSmall(abs))
    if (statSync(absTarget).isDirectory()) walk(absTarget, visit, skip)
    else visit(absTarget)
  }
}

function scanWorkingTree(findings, root) {
  const files = gitLines(['ls-files', '-z', '--cached', '--others', '--exclude-standard'])
  for (const rel of files) {
    const abs = path.join(root, rel)
    findings.file(rel, existsSync(abs) ? readIfSmall(abs) : undefined)
  }
}

function scanBranchName(findings) {
  const result = spawnSync('git', ['symbolic-ref', '--quiet', '--short', 'HEAD'])
  if (result.status === 0)
    findings.text('current branch name', result.stdout.toString('utf8').trim())
}

function scanStaged(findings) {
  const staged = gitLines(['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR'])
  for (const rel of staged) findings.file(rel, git(['show', `:${rel}`]))
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
      const cache = path.join(nextDir, 'cache')
      scanPaths(findings, root, ['.next', 'public', '.vercel/output'], (abs) => abs === cache)
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
