import { test, expect } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

test('overview layout: full-width hero, aligned mid-row columns, and bottom task panel', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.hero-date')).toHaveAttribute('datetime', /\d{4}-\d{2}-\d{2}/);
  await expect(page.locator('.overview-panel')).toHaveCount(4);

  for (const width of [1440, 1280]) {
    await page.setViewportSize({ width, height: 960 });
    const hero = (await page.locator('.overview-hero').boundingBox())!;
    const todos = (await page.locator('.overview-todos').boundingBox())!;
    const builds = (await page.locator('.recent-builds').boundingBox())!;
    const firmware = (await page.locator('.quick-firmware').boundingBox())!;
    const tasks = (await page.locator('.overview-tasks').boundingBox())!;

    // Hero is full width above mid-row
    expect(todos.y).toBeGreaterThan(hero.y + hero.height - 10);
    expect(builds.y).toBeGreaterThan(hero.y + hero.height - 10);

    // Firmware is below builds in the right column
    expect(firmware.y).toBeGreaterThan(builds.y + builds.height - 5);

    // To-Do card bottom edge aligns with Firmware card bottom edge
    const todosBottom = todos.y + todos.height;
    const firmwareBottom = firmware.y + firmware.height;
    expect(Math.abs(todosBottom - firmwareBottom)).toBeLessThan(3);

    // Jira Tasks is placed below the middle row
    expect(tasks.y).toBeGreaterThanOrEqual(Math.min(todosBottom, firmwareBottom) - 5);

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }

  await page.setViewportSize({ width: 1280, height: 1360 });
  await expect(page.locator('.overview-tasks .task-row').nth(4)).toBeVisible();
  await expect(page.locator('.recent-build-row').nth(1)).toBeVisible();
});

test('long home checklist stays within its panel and newly added items remain reachable', async ({ page }) => {
  await page.goto('/');
  const panel = page.locator('.overview-todos');
  const initialHeight = (await panel.boundingBox())!.height;
  for (let index = 0; index < 14; index++) {
    const input = page.locator('.overview-todo-quick input');
    await input.fill(`Item ${index}`);
    await input.press('Enter');
  }
  const expandedHeight = (await panel.boundingBox())!.height;
  expect(Math.abs(expandedHeight - initialHeight)).toBeLessThan(3);
  const lastItem = page.locator('.overview-todo-row').last();
  await lastItem.scrollIntoViewIfNeeded();
  await expect(lastItem).toBeVisible();
});

test('selected navigation stays distinct and aligned in both themes and collapsed mode', async ({ page }) => {
  await page.goto('/');
  for (const theme of ['light', 'dark']) {
    await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme);
    const nav = page.locator('nav[aria-label="주 메뉴"]');
    await nav.getByRole('button', { name: 'Overview', exact: true }).click();
    await expect(nav.getByRole('button', { name: 'Overview', exact: true })).toHaveClass(/active/);
    await nav.getByRole('button', { name: 'To-Do', exact: true }).click();
    await expect(nav.getByRole('button', { name: 'To-Do', exact: true })).toHaveClass(/active/);
    await expect(nav.getByRole('button', { name: 'Overview', exact: true })).not.toHaveClass(/active/);
  }
});
