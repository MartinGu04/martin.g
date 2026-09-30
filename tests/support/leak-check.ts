/*
 * Shared leak-check test helpers. Every term here is a SYNTHETIC canary invented for
 * testing. Never put a real confidential term in a test, fixture, snapshot or file name.
 */
import { spawnSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const SCRIPT = fileURLToPath(new URL('../../scripts/leak-check.mjs', import.meta.url))

export const LATIN = 'Zephyrquill Nimbex'
export const HEBREW = 'גלזברנוף' // ends in a final letter on purpose
export const TERMS = [LATIN, HEBREW]
export const encode = (terms: string[]) => Buffer.from(terms.join('\n'), 'utf8').toString('base64')
export const B64 = encode(TERMS)

export function tempDir() {
  return mkdtempSync(path.join(tmpdir(), 'leak-check-'))
}

/** Variables child processes need on Windows (git and Node resolve temp and system dirs). */
const PLATFORM_ENV = [
  'SystemRoot',
  'SYSTEMROOT',
  'TEMP',
  'TMP',
  'USERPROFILE',
  'ComSpec',
  'PATHEXT',
]

/** Runs the leak-check CLI with a minimal, explicit environment (no inherited CI or terms). */
export function cli(
  args: string[],
  opts: { cwd?: string; env?: Record<string, string>; input?: string; nodeArgs?: string[] } = {},
) {
  const platform: Record<string, string> = {}
  for (const name of PLATFORM_ENV) {
    const value = process.env[name]
    if (value) platform[name] = value
  }
  const result = spawnSync(process.execPath, [...(opts.nodeArgs ?? []), SCRIPT, ...args], {
    cwd: opts.cwd ?? process.cwd(),
    env: {
      NODE_ENV: 'test',
      PATH: process.env.PATH ?? '',
      HOME: process.env.HOME ?? '',
      ...platform,
      ...opts.env,
    },
    input: opts.input,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  })
  return {
    status: result.status,
    signal: result.signal,
    output: `${result.stdout}${result.stderr}`,
  }
}
