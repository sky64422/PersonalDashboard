import { test, expect } from '@playwright/test';

test('grouped search exposes every source and scrolls keyboard selection into view', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Control+k');
  const list = page.getByRole('listbox');
  await expect(list.getByRole('group')).toHaveCount(3);
  const input = page.getByRole('combobox');
  await input.press('End');
  const selected = list.getByRole('option', { selected: true });
  await expect(selected).toBeInViewport();
  await expect(input).toBeFocused();
  await expect(selected).toContainText('atlas_a2');
  await input.press('Enter');
  await expect(page.getByRole('dialog')).toContainText('atlas_a2');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Firmware', exact: true })).toHaveAttribute('aria-current', 'page');
});

test('compact settings stays named, switch supports keyboard, clear restores input focus', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 700 });
  await page.goto('/');
  await page.getByRole('button', { name: '워크스페이스 설정', exact: true }).click();
  const motion = page.getByRole('switch', { name: '움직임 줄이기' });
  await motion.focus();
  await page.keyboard.press('Space');
  await expect(motion).toBeChecked();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'My Tasks', exact: true }).click();
  const input = page.getByLabel('업무 검색', { exact: true });
  await input.fill('test');
  await page.getByRole('button', { name: '업무 검색 지우기' }).click();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('');
});
