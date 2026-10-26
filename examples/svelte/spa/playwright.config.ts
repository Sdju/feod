import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'
const port = process.env.CI ? 4176 : 5176
export default defineConfig({
  testDir: './e2e', timeout: 30_000, forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0, workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: { baseURL: `http://localhost:${port}`, trace: 'on-first-retry', headless: true },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: { command: process.env.CI ? 'npm run preview' : 'npm run dev', port, reuseExistingServer: false },
})
