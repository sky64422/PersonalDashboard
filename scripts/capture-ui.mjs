import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
await mkdir('tmp/screenshots', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge' });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1 });
await page.goto('http://127.0.0.1:1420');
await page.emulateMedia({ reducedMotion: 'reduce' });
for (const view of ['Overview', 'My Tasks', 'Builds', 'Firmware']) {
  await page.getByRole('button', { name: view, exact: true }).click();
  await page.screenshot({ path: `tmp/screenshots/${view.replace(' ', '-').toLowerCase()}.png`, fullPage: true });
}
await page.setViewportSize({ width: 900, height: 700 });
await page.getByRole('button', { name: 'Overview', exact: true }).click();
await page.screenshot({ path: 'tmp/screenshots/overview-small.png', fullPage: true });
await browser.close();
