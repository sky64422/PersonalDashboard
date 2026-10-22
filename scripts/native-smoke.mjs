import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

// Start the production executable with WebView2 debugging enabled only for this check.
const browser = await chromium.connectOverCDP('http://127.0.0.1:9227');
const page = browser.contexts()[0].pages()[0];
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await mkdir('tmp/screenshots', { recursive: true });
await expect(page.getByRole('heading', { level: 1 })).toContainText('focus');
await page.getByRole('group', { name: '홈 업무 보기' }).getByRole('button', { name: /리뷰 대기/ }).click();
await expect(page.locator('.overview-tasks .task-row')).toHaveCount(2);
await page.getByRole('group', { name: '홈 업무 보기' }).getByRole('button', { name: /우선순위/ }).click();
for (const view of ['My Tasks', 'Builds', 'Firmware', 'Overview']) {
  await page.getByRole('button', { name: view, exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
await page.getByRole('button', { name: 'My Tasks', exact: true }).click();
const task = page.getByRole('button', { name: /FW-279/ });
await task.click();
await expect(page.getByRole('dialog')).toBeVisible();
await page.keyboard.press('Escape');
await expect(task).toBeFocused();
await page.keyboard.press('Control+k');
await page.getByLabel('통합 검색어').fill('2.4.0');
await expect(page.getByRole('option').first()).toBeVisible();
await page.keyboard.press('Escape');
await page.getByRole('button', { name: 'Overview', exact: true }).click();
await page.getByText('Made for your flow.').scrollIntoViewIfNeeded();
await page.evaluate(() => scrollTo(0, 0));
await page.screenshot({ path: 'tmp/screenshots/native-overview.png', fullPage: true });
const report = { url: page.url(), viewport: await page.evaluate(() => ({ width: innerWidth, height: innerHeight, dpr: devicePixelRatio })), errors };
expect(errors).toEqual([]);
await writeFile('tmp/native-smoke.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));
await browser.close();
