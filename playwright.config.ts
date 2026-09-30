import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.E2E_PORT ?? 3100)
// Optional: a preinstalled Chromium when the bundled browser version is unavailable.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined
const launchOptions = executablePath ? { executablePath } : {}

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
    { name: 'desktop', use: { ...devices['Desktop Chrome'], launchOptions } },
    { name: 'mobile', use: { ...devices['Pixel 7'], launchOptions } },
  ],
  webServer: {
    // Tests run against the production build (`pnpm build` first).
    command: `pnpm exec next start -p ${PORT}`,
    url: `http://localhost:${PORT}/en`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
