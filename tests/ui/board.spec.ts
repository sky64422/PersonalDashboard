import { test, expect } from '@playwright/test';

test('board assigns each owned task once and filters a column without losing the layout', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'My Tasks', exact: true }).click();
  const expected = [['Open', 3], ['Progress', 4], ['Resolved', 1], ['Closed', 1]] as const;
  for (const [name, count] of expected) {
    await expect(page.getByRole('region', { name, exact: true }).locator('.task-tile')).toHaveCount(count);
  }
  const keys = await page.locator('.tile-key').allTextContents();
  expect(new Set(keys).size).toBe(9);
  expect(keys).not.toContain('FW-201');
  await page.getByLabel('업무 상태', { exact: true }).selectOption('resolved');
  await expect(page.locator('.task-column')).toHaveCount(4);
  await expect(page.locator('.task-tile')).toHaveCount(1);
  await expect(page.getByRole('region', { name: 'Resolved', exact: true })).toContainText('SDK-130');
  await page.getByRole('button', { name: '필터 초기화' }).click();
  await page.setViewportSize({ width: 900, height: 700 });
  expect(await page.locator('.task-board-scroll').evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true);
  const closed = page.locator('.task-open').filter({ hasText: 'FW-200' });
  await closed.focus();
  await expect(closed).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toContainText('Closed');
  await page.keyboard.press('Escape');
  await expect(closed).toBeFocused();
});
