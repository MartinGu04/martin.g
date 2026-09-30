#!/usr/bin/env node
/**
 * Project policy checks that generic linters do not cover.
 *
 *   node scripts/lint-policy.mjs           source checks (part of `pnpm lint`)
 *   node scripts/lint-policy.mjs --built   checks on prerendered HTML (part of `pnpm build`)
 *
 * Rules:
 *   logical-css      physical left/right properties are not allowed (RTL is first-class)
 *   no-em-dash       U+2014 is not allowed in public copy or source
 *   no-next-public   no NEXT_PUBLIC_ variables at all
 *   blocklist-var    application code never references the leak-check variable
 *   source-maps      next.config.ts keeps productionBrowserSourceMaps: false
 *   svg-hygiene      SVGs carry no editor metadata or layer names
 *   image-metadata   raster images carry no EXIF/XMP/IPTC/text metadata
 *   hooks            locally, core.hooksPath points at .githooks
 *   invisible-chars  no raw zero-width or bidi control characters in source (Trojan Source)
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

// Built from its code point so the source itself never contains the character.
export const EM_DASH = String.fromCodePoint(0x2014)

/* ------------------------------------------------------------------ */
/* Rules                                                               */
/* ------------------------------------------------------------------ */

const PHYSICAL_CSS = [
  /(?:^|[\s;{])(?:margin|padding|border|scroll-margin|scroll-padding)-(?:left|right)(?:-[a-z]+)?\s*:/,
  /(?:^|[\s;{])(?:left|right)\s*:/,
  /(?:^|[\s;{])border-(?:top|bottom)-(?:left|right)-radius\s*:/,
  /(?:text-align|float|clear)\s*:\s*(?:left|right)\b/,
]

const PHYSICAL_JSX = [
  /\b(?:margin|padding|border|scrollMargin|scrollPadding)(?:Left|Right)\b/,
  /\bborder(?:Top|Bottom)(?:Left|Right)Radius\b/,
  /\b(?:textAlign|float|clear)\s*:\s*['"](?:left|right)['"]/,
]

/** @returns {{line: number, rule: string, message: string}[]} */
export function checkCss(source) {
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '))
  const problems = []
  withoutComments.split('\n').forEach((text, i) => {
    if (PHYSICAL_CSS.some((re) => re.test(text))) {
      problems.push({
        line: i + 1,
        rule: 'logical-css',
        message: 'use logical properties (inline-start/end)',
      })
    }
  })
  return problems
}

export function checkJsx(source) {
  const problems = []
  source.split('\n').forEach((text, i) => {
    if (PHYSICAL_JSX.some((re) => re.test(text))) {
      problems.push({ line: i + 1, rule: 'logical-css', message: 'use logical style properties' })
    }
  })
  return problems
}

export function checkEmDash(source) {
  const problems = []
  source.split('\n').forEach((text, i) => {
    if (text.includes(EM_DASH)) {
      problems.push({
        line: i + 1,
        rule: 'no-em-dash',
        message: 'em dashes are not allowed in copy',
      })
    }
  })
  return problems
}

export function checkNextPublic(source) {
  const problems = []
  source.split('\n').forEach((text, i) => {
    if (/NEXT_PUBLIC_[A-Z0-9]/.test(text)) {
      problems.push({
        line: i + 1,
        rule: 'no-next-public',
        message: 'NEXT_PUBLIC_ variables are not allowed',
      })
    }
  })
  return problems
}

// Built from code points so this file never contains the characters it forbids.
const INVISIBLE_CHARS = new RegExp(
  `[${[
    [0xad, 0xad],
    [0x200b, 0x200f],
    [0x202a, 0x202e],
    [0x2060, 0x2064],
    [0x2066, 0x2069],
    [0xfeff, 0xfeff],
  ]
    .map(([a, b]) => `${String.fromCodePoint(a)}-${String.fromCodePoint(b)}`)
    .join('')}]`,
  'u',
)

export function checkInvisibleChars(source) {
  const problems = []
  source.split('\n').forEach((text, i) => {
    if (INVISIBLE_CHARS.test(text)) {
      problems.push({
        line: i + 1,
        rule: 'invisible-chars',
        message: 'use escapes or code points instead of raw invisible or bidi control characters',
      })
    }
  })
  return problems
}

export function checkBlocklistVar(source) {
  const problems = []
  source.split('\n').forEach((text, i) => {
    if (/LEAK_CHECK/.test(text)) {
      problems.push({
        line: i + 1,
        rule: 'blocklist-var',
        message: 'app code must never read the leak-check blocklist',
      })
    }
  })
  return problems
}

export function checkSourceMaps(source) {
  return /^\s*productionBrowserSourceMaps:\s*false,?\s*$/m.test(source)
    ? []
    : [
        {
          line: 1,
          rule: 'source-maps',
          message: 'productionBrowserSourceMaps must be explicitly false',
        },
      ]
}

const SVG_METADATA = [
  /data-name=/,
  /<metadata[\s>]/,
  /\binkscape:/,
  /\bsodipodi:/,
  /\bsketch:/,
  /xmlns:serif/,
  /<!--\s*Generator/i,
]

export function checkSvg(source) {
  return SVG_METADATA.some((re) => re.test(source))
    ? [
        {
          line: 1,
          rule: 'svg-hygiene',
          message: 'remove editor metadata, layer names and generator comments',
        },
      ]
    : []
}

/** Detects metadata containers in PNG, JPEG and WebP files. */
export function findImageMetadata(buffer) {
  const found = []
  // PNG: 8-byte signature, then length/type/data/crc chunks.
  if (buffer.length > 8 && buffer.readUInt32BE(0) === 0x89504e47) {
    let offset = 8
    while (offset + 8 <= buffer.length) {
      const length = buffer.readUInt32BE(offset)
      const type = buffer.toString('latin1', offset + 4, offset + 8)
      if (['tEXt', 'zTXt', 'iTXt', 'eXIf'].includes(type)) found.push(`PNG ${type}`)
      offset += 12 + length
      if (type === 'IEND') break
    }
  }
  // JPEG: markers until start of scan. APP1 (Exif/XMP), APP13 (IPTC), COM (comment).
  if (buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2
    while (offset + 4 <= buffer.length && buffer[offset] === 0xff) {
      const marker = buffer[offset + 1]
      if (marker === 0xda) break
      const length = buffer.readUInt16BE(offset + 2)
      if (marker === 0xe1) found.push('JPEG APP1 (Exif/XMP)')
      if (marker === 0xed) found.push('JPEG APP13 (IPTC)')
      if (marker === 0xfe) found.push('JPEG comment')
      offset += 2 + length
    }
  }
  // WebP: RIFF container with EXIF / XMP chunks.
  if (
    buffer.length > 12 &&
    buffer.toString('latin1', 0, 4) === 'RIFF' &&
    buffer.toString('latin1', 8, 12) === 'WEBP'
  ) {
    let offset = 12
    while (offset + 8 <= buffer.length) {
      const type = buffer.toString('latin1', offset, offset + 4)
      const length = buffer.readUInt32LE(offset + 4)
      if (type === 'EXIF' || type === 'XMP ') found.push(`WebP ${type.trim()}`)
      offset += 8 + length + (length % 2)
    }
  }
  return found
}

/* ------------------------------------------------------------------ */
/* Runner                                                              */
/* ------------------------------------------------------------------ */

function walk(absDir, out = []) {
  if (!existsSync(absDir)) return out
  for (const entry of readdirSync(absDir, { withFileTypes: true })) {
    const abs = path.join(absDir, entry.name)
    if (entry.isDirectory()) walk(abs, out)
    else if (entry.isFile()) out.push(abs)
  }
  return out
}

function checkHooks(env) {
  if (env.CI || env.VERCEL) return []
  const inside = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], { encoding: 'utf8' })
  if (inside.status !== 0) return []
  const hooksPath = spawnSync('git', ['config', '--get', 'core.hooksPath'], {
    encoding: 'utf8',
  }).stdout.trim()
  return hooksPath === '.githooks'
    ? []
    : [
        {
          file: '.git/config',
          line: 1,
          rule: 'hooks',
          message:
            'core.hooksPath is not .githooks. Run: pnpm install (or node scripts/setup-hooks.mjs)',
        },
      ]
}

export function runSource(root, env = process.env) {
  const problems = []
  const report = (file, list) =>
    list.forEach((p) => problems.push({ file: path.relative(root, file), ...p }))

  for (const file of walk(path.join(root, 'src'))) {
    const ext = path.extname(file)
    if (
      ['.png', '.jpg', '.jpeg', '.webp', '.ico', '.gif', '.avif', '.mp4', '.webm'].includes(ext)
    ) {
      if (ext !== '.ico')
        report(
          file,
          findImageMetadata(readFileSync(file)).map((m) => ({
            line: 1,
            rule: 'image-metadata',
            message: m,
          })),
        )
      continue
    }
    // Compressed font binaries are not text: decoding them as UTF-8 yields arbitrary code
    // points. Their bytes are still scanned by leak-check (files/build modes).
    if (['.woff2', '.woff', '.ttf', '.otf'].includes(ext)) continue
    const source = readFileSync(file, 'utf8')
    if (ext === '.css') report(file, checkCss(source))
    if (ext === '.tsx' || ext === '.ts') report(file, checkJsx(source))
    if (ext === '.svg') report(file, checkSvg(source))
    report(file, checkEmDash(source))
    report(file, checkNextPublic(source))
    report(file, checkBlocklistVar(source))
    report(file, checkInvisibleChars(source))
  }

  for (const dir of ['scripts', 'tests', 'docs', '.githooks', '.github']) {
    for (const file of walk(path.join(root, dir))) {
      report(file, checkInvisibleChars(readFileSync(file, 'utf8')))
    }
  }

  for (const file of walk(path.join(root, 'public'))) {
    const ext = path.extname(file)
    if (ext === '.svg') report(file, checkSvg(readFileSync(file, 'utf8')))
    if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
      report(
        file,
        findImageMetadata(readFileSync(file)).map((m) => ({
          line: 1,
          rule: 'image-metadata',
          message: m,
        })),
      )
    }
  }

  for (const rel of [
    'next.config.ts',
    '.env.example',
    'vercel.json',
    ...walk(path.join(root, '.github')).map((f) => path.relative(root, f)),
  ]) {
    const file = path.join(root, rel)
    if (existsSync(file) && statSync(file).isFile())
      report(file, checkNextPublic(readFileSync(file, 'utf8')))
  }
  report(
    path.join(root, 'next.config.ts'),
    checkSourceMaps(readFileSync(path.join(root, 'next.config.ts'), 'utf8')),
  )
  problems.push(...checkHooks(env))
  return problems
}

export function runBuilt(root) {
  const problems = []
  const appDir = path.join(root, '.next', 'server', 'app')
  for (const file of walk(appDir).filter((f) => f.endsWith('.html') || f.endsWith('.rsc'))) {
    checkEmDash(readFileSync(file, 'utf8')).forEach((p) =>
      problems.push({ file: path.relative(root, file), ...p }),
    )
  }
  return problems
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const root = process.cwd()
  const built = process.argv.includes('--built')
  if (built && !existsSync(path.join(root, '.next', 'server', 'app'))) {
    console.error('lint-policy: no build output. Run next build first.')
    process.exit(2)
  }
  const problems = built ? runBuilt(root) : runSource(root)
  for (const p of problems) console.error(`${p.file}:${p.line}  ${p.rule}  ${p.message}`)
  if (problems.length > 0) {
    console.error(`lint-policy: ${problems.length} problem(s).`)
    process.exit(1)
  }
  console.log(`lint-policy${built ? ' --built' : ''}: clean.`)
}
