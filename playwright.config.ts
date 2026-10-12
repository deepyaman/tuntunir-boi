import { defineConfig, devices } from '@playwright/test';

// The site is served under the GitHub Pages project path, so baseURL includes it.
const baseURL = 'http://localhost:4321/tuntunir-boi/';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    // Run against Google Chrome stable (installed locally; `playwright install chrome` in CI)
    // instead of Playwright's bundled Chromium, which is not available for every macOS version.
    channel: 'chrome',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    // Astro backgrounds the preview server when it detects an AI coding agent;
    // --ignore-lock keeps it in the foreground so Playwright can start and stop it.
    command: 'npm run build && npx astro preview --ignore-lock',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
