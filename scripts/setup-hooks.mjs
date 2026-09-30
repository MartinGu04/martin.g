#!/usr/bin/env node
/**
 * Runs on `pnpm install` (the `prepare` script). Git does not run hooks from a committed
 * directory on its own, so this points core.hooksPath at .githooks and makes sure the
 * hooks are executable. scripts/lint-policy.mjs verifies the setting on every local lint.
 */
import { execFileSync, spawnSync } from 'node:child_process'
import { chmodSync, existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

export const HOOKS_DIR = '.githooks'

if (process.env.CI || process.env.VERCEL) {
  // CI and Vercel never commit; their leak checks run as explicit pipeline steps.
  process.exit(0)
}

const inside = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], { encoding: 'utf8' })
if (inside.status !== 0 || inside.stdout.trim() !== 'true') {
  console.warn('setup-hooks: not a Git work tree, skipping.')
  process.exit(0)
}

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()
const hooksDir = path.join(root, HOOKS_DIR)
if (!existsSync(hooksDir)) {
  console.error(`setup-hooks: ${HOOKS_DIR} is missing.`)
  process.exit(1)
}

for (const name of readdirSync(hooksDir)) chmodSync(path.join(hooksDir, name), 0o755)
execFileSync('git', ['config', 'core.hooksPath', HOOKS_DIR], { cwd: root })
console.log(`setup-hooks: core.hooksPath -> ${HOOKS_DIR} (${readdirSync(hooksDir).join(', ')})`)
