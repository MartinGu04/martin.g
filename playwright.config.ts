import { tmpdir } from 'node:os'
import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.E2E_PORT ?? 3100)
// Optional: a preinstalled Chromium when the bundled browser version is unavailable.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined
// The suite only talks to the local server: no proxy (an inherited one can stall form
// navigations), and the third-party Enable menu never loads (cdn.enable.co.il does not
// resolve), so the suite proves the site is accessible on its own and stays deterministic.
// The widget's integration is tested with a stand-in script (tests/e2e/trust.spec.ts).
const args = ['--no-proxy-server', '--host-resolver-rules=MAP cdn.enable.co.il ~NOTFOUND']
const launchOptions = executablePath ? { executablePath, args } : { args }

// Contact form submissions are delivered to this file instead of a real service
// (src/lib/contact/notifiers.ts, the outbox notifier). Tests read it back.
process.env.E2E_OUTBOX ??= path.join(tmpdir(), `martin-g-e2e-outbox-${PORT}.jsonl`)

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    // Encodes every optimized image the suite requests, at each project's devices, before
    // any test runs: a fresh server encodes on first request (tests/e2e/images.setup.ts).
    { name: 'setup', testMatch: /images\.setup\.ts$/, use: { launchOptions } },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], launchOptions },
      dependencies: ['setup'],
    },
    { name: 'mobile', use: { ...devices['Pixel 7'], launchOptions }, dependencies: ['setup'] },
  ],
  webServer: {
    // Tests run against the production build (`pnpm build` first).
    command: `pnpm exec next start -p ${PORT}`,
    url: `http://localhost:${PORT}/en`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      CONTACT_OUTBOX_FILE: process.env.E2E_OUTBOX,
      // People take seconds; tests fill the form at once. The timing check is unit tested.
      CONTACT_MIN_FILL_MS: '0',
    },
  },
})
