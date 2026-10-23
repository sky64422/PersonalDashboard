import { chromium, expect } from '@playwright/test';

// Same process-scoped WebView2 debug setup as native-smoke.mjs.
const browser = await chromium.connectOverCDP('http://127.0.0.1:9227');
const page = browser.contexts()[0].pages()[0];
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.getByRole('button', { name: '워크스페이스 설정', exact: true }).click();
await page.getByRole('radio', { name: /Midnight/ }).check();
const motion = page.getByRole('switch', { name: '움직임 줄이기' });
await motion.focus();
await page.keyboard.press('Space');
await expect(motion).toBeChecked();
await page.keyboard.press('Space');
await expect(motion).not.toBeChecked();
await expect(page.getByRole('dialog')).toHaveCSS('background-color', 'rgb(30, 30, 28)');
await page.keyboard.press('Escape');
await page.reload();
await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
for (const view of ['My Tasks', 'Builds', 'Firmware', 'Overview']) {
  await page.getByRole('button', { name: view, exact: true }).click();
  await expect(page.locator(view === 'My Tasks' ? '.task-tile' : '.card').first()).toHaveCSS('background-color', view === 'My Tasks' ? 'rgb(34, 34, 31)' : 'rgb(30, 30, 28)');
}
await page.keyboard.press('Control+k');
await expect(page.getByRole('listbox').getByRole('group')).toHaveCount(3);
await page.getByRole('combobox').press('End');
await expect(page.getByRole('option', { selected: true })).toBeInViewport();
await page.keyboard.press('Escape');
await page.getByRole('button', { name: /FW-284/ }).click();
await expect(page.getByRole('dialog')).toHaveCSS('background-color', 'rgb(30, 30, 28)');
await page.keyboard.press('Escape');
await page.getByRole('button', { name: '워크스페이스 설정', exact: true }).click();
await page.getByRole('radio', { name: /Daylight/ }).check();
await expect(page.getByRole('dialog')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
await page.getByRole('radio', { name: /Midnight/ }).check();
await page.keyboard.press('Escape');
await page.screenshot({ path: 'tmp/screenshots/native-dark.png', fullPage: true });
expect(errors).toEqual([]);
console.log('Native theme switching, saved reload, four views and detail portal passed; page errors: 0');
await browser.close();
