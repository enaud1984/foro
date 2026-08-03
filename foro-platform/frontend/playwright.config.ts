import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

const chromeDiSistema = process.env['PLAYWRIGHT_CHROMIUM_PATH'] ?? '/opt/google/chrome/chrome';

export default defineConfig({
  testDir: './e2e',
  outputDir: 'test-results',
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://127.0.0.1:4200',
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    launchOptions: existsSync(chromeDiSistema)
      ? { executablePath: chromeDiSistema, args: ['--no-sandbox'] }
      : undefined
  },
  webServer: {
    command: 'npm start -- --host 127.0.0.1',
    url: 'http://127.0.0.1:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000
  }
});
