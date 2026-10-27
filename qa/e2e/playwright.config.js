import { defineConfig } from '@playwright/test';

const BASE = process.env.QA_WEB_URL || 'http://127.0.0.1:5173';
if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?/.test(BASE)) {
  throw new Error(`E2E suite refuses to run against a non-local frontend: ${BASE}`);
}

export default defineConfig({
  testDir: './tests',
  timeout: 4 * 60 * 1000,
  expect: { timeout: 8000 },
  workers: 1, // tests share one local database
  fullyParallel: false,
  reporter: [['list'], ['json', { outputFile: 'results/playwright-report.json' }]],
  use: {
    baseURL: BASE,
    channel: 'chrome', // system Chrome - no browser download needed
    viewport: { width: 1280, height: 800 },
    actionTimeout: 8000,
    navigationTimeout: 20000,
  },
});
