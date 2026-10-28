import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

// Run only against an isolated WebView2 profile; this script creates and removes a test event.
const browser = await chromium.connectOverCDP('http://127.0.0.1:9227');
const page = browser.contexts()[0].pages()[0];
const errors = [];
const externalDataRequests = [];
page.on('pageerror', error => errors.push(error.message));
page.on('request', request => {
  if (['fetch', 'xhr'].includes(request.resourceType()) && /^https?:/.test(request.url()) && !request.url().includes('tauri.localhost')) externalDataRequests.push(request.url());
});
await mkdir('tmp/screenshots', { recursive: true });
await page.getByRole('button', { name: 'Calendar', exact: true }).click();
await expect(page.locator('nav .nav-item').nth(1)).toHaveAccessibleName('Calendar');
await page.getByRole('button', { name: '일정 추가', exact: true }).click();
await page.getByLabel('제목', { exact: true }).fill('네이티브 Calendar 저장 검증');
await page.getByLabel('메모', { exact: true }).fill('외부 서비스 없이 로컬에 저장합니다.');
await page.getByRole('button', { name: '저장', exact: true }).click();
await expect(page.getByRole('dialog')).toHaveCount(0);
await page.reload();
await page.getByRole('button', { name: 'Calendar', exact: true }).click();
await page.getByRole('button', { name: '네이티브 Calendar 저장 검증 일정 수정', exact: true }).click();
await expect(page.getByLabel('메모', { exact: true })).toHaveValue('외부 서비스 없이 로컬에 저장합니다.');
await expect(page.getByRole('dialog')).toHaveCSS('opacity', '1');
await page.screenshot({ path: 'tmp/screenshots/native-calendar-editor.png' });
await page.getByRole('button', { name: '삭제', exact: true }).click();
await page.getByRole('button', { name: '일정 삭제', exact: true }).click();
await expect(page.getByRole('dialog')).toHaveCount(0);
await page.getByLabel('월 선택', { exact: true }).fill('2026-10');
await page.locator('[data-date="2026-10-09"]').click();
await expect(page.locator('.calendar-holiday')).toContainText('한글날');
await page.locator('[data-date="2026-10-09"]').focus();
await page.keyboard.press('ArrowRight');
await expect(page.locator('[data-date="2026-10-10"]')).toBeFocused();
const geometry = [];
for (const theme of ['Daylight', 'Midnight']) {
  await page.getByRole('button', { name: '워크스페이스 설정', exact: true }).click();
  await page.getByRole('radio', { name: new RegExp(theme) }).check();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: '오늘', exact: true }).click();
  geometry.push(await page.evaluate(() => ({ width: innerWidth, height: innerHeight, overflow: document.documentElement.scrollWidth - innerWidth })));
  expect(geometry.at(-1).overflow).toBeLessThanOrEqual(0);
  await page.screenshot({ path: `tmp/screenshots/native-calendar-${theme}.png`, fullPage: true });
}
expect(errors).toEqual([]);
expect(externalDataRequests).toEqual([]);
await writeFile('tmp/native-calendar-result.json', JSON.stringify({ geometry, errors, externalDataRequests, crud: 'passed', keyboard: 'passed', themes: 'passed' }, null, 2));
console.log('Native Calendar CRUD/reload, holidays, keyboard, both themes passed; page errors: 0, external data requests: 0');
await browser.close();
