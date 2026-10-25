import { test, expect } from '@playwright/test';

test('command palette supports arrows and Enter without leaving the input', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Control+k');
  const input = page.getByLabel('통합 검색어');
  await input.fill('FW-279');
  await input.press('ArrowDown');
  await expect(input).toBeFocused();
  await input.press('Enter');
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'FW-279', exact: true })).toBeVisible();
});

test('clipboard icon confirms actual success, not denial', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.getByRole('button', { name: 'Firmware', exact: true }).click();
  await page.getByLabel('펌웨어 검색', { exact: true }).fill('2.4.0');
  const copy = page.getByRole('button', { name: /경로 복사/ });
  await copy.click();
  await expect(copy).toHaveAttribute('data-copied', 'true');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('atlas_a1_2.4.0_release.bin');
});

test('in-app reduced motion includes portal dialogs', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '워크스페이스 설정', exact: true }).click();
  await page.getByRole('switch', { name: '움직임 줄이기' }).check();
  await page.keyboard.press('Escape');
  await page.locator('.overview-tasks .task-row').filter({ hasText: 'FW-284' }).click();
  expect(await page.getByRole('dialog').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
});
