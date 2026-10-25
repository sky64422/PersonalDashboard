import { test, expect } from '@playwright/test';

test('theme picker persists Midnight, styles portals and restores Daylight', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '워크스페이스 설정', exact: true }).click();
  await page.getByRole('radio', { name: /Midnight/ }).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('dialog')).toHaveCSS('background-color', 'rgb(30, 31, 33)');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  for (const view of ['Jira Tasks', 'Builds', 'Firmware', 'Overview']) {
    await page.getByRole('button', { name: view, exact: true }).click();
    if (view === 'Overview') {
    for (const panel of await page.locator('.overview-panel').all()) {
      await expect(panel).toHaveCSS('background-color', 'rgb(30, 31, 33)');
    }
  } else {
    await expect(page.locator(view === 'Jira Tasks' ? '.task-tile' : '.card').first()).toHaveCSS('background-color', view === 'Jira Tasks' ? 'rgb(34, 35, 38)' : 'rgb(30, 31, 33)');
  }
  }
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('dialog')).toHaveCSS('background-color', 'rgb(30, 31, 33)');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: '워크스페이스 설정', exact: true }).click();
  await expect(page.getByRole('radio', { name: /Midnight/ })).toBeChecked();
  await page.getByRole('radio', { name: /Midnight/ }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('radio', { name: /Daylight/ })).toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('unavailable theme storage reports failure without blocking the session', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => { throw new Error('Storage denied'); };
  });
  await page.goto('/');
  await page.getByRole('button', { name: '워크스페이스 설정', exact: true }).click();
  await page.getByRole('radio', { name: /Midnight/ }).check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('status')).toContainText('이번 실행에만 적용');
});
