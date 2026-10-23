import { test, expect } from '@playwright/test';

test('hidden tasks persist, leave overview and search, and can be restored', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'My Tasks', exact: true }).click();
  await page.getByRole('button', { name: 'FW-284 숨기기', exact: true }).click();
  await expect(page.locator('.task-open').filter({ hasText: 'FW-284' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Overview', exact: true }).click();
  await expect(page.getByText('FW-284', { exact: true })).toHaveCount(0);
  await page.keyboard.press('Control+k');
  await page.getByLabel('통합 검색어').fill('FW-284');
  await expect(page.getByRole('option')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.reload();
  await page.getByRole('button', { name: 'My Tasks', exact: true }).click();
  await expect(page.locator('.task-open').filter({ hasText: 'FW-284' })).toHaveCount(0);
  await page.getByRole('button', { name: /숨긴 업무/ }).click();
  await page.getByRole('button', { name: /숨긴 업무/ }).hover();
  await expect(page.getByRole('button', { name: /숨긴 업무/ })).toHaveCSS('background-color', 'rgb(48, 47, 52)');
  await expect(page.getByRole('button', { name: /숨긴 업무/ })).toHaveCSS('color', 'rgb(255, 255, 255)');
  await page.locator('.task-open').filter({ hasText: 'FW-284' }).click();
  await expect(page.getByRole('dialog')).toContainText('In Progress');
  await page.getByRole('button', { name: '업무 다시 표시', exact: true }).click();
  await expect(page.getByText('숨긴 업무가 없어요')).toBeVisible();
  await page.getByRole('button', { name: /숨긴 업무/ }).click();
  await expect(page.locator('.task-open').filter({ hasText: 'FW-284' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'My Tasks', exact: true }).click();
  await expect(page.locator('.task-open')).toHaveCount(9);
});

test('storage denial reports session-only hiding', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('denied'); }; });
  await page.goto('/');
  await page.getByRole('button', { name: 'My Tasks', exact: true }).click();
  await page.getByRole('button', { name: 'FW-284 숨기기', exact: true }).click();
  await expect(page.locator('.task-open').filter({ hasText: 'FW-284' })).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('저장');
});
