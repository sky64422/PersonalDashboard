import { test, expect } from '@playwright/test';
import { formatDateKey } from '../../src/features/todos/todoModel';
import { TODOS_STORAGE_KEY } from '../../src/features/todos/todoStorage';

test('large history preview spans many months without overwriting saved todos', async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key, '[]'), TODOS_STORAGE_KEY);
  await page.goto('/?todoHistory=large');
  await expect(page.getByRole('heading', { name: 'To-Do', exact: true })).toBeVisible();
  await expect(page.getByRole('tablist', { name: '연도별 히스토리 선택' }).getByRole('tab')).toHaveText(['2020년', '2021년', '2022년', '2023년', '2024년', '2025년', '2026년']);
  await page.getByRole('tablist', { name: '월별 히스토리 선택' }).getByRole('tab').nth(1).click();
  expect(await page.locator('.hanging-note').count()).toBeGreaterThanOrEqual(28);
  await page.getByLabel('새 할 일 입력', { exact: true }).fill('미리보기 전용');
  await page.getByLabel('새 할 일 입력', { exact: true }).press('Enter');
  expect(await page.evaluate(key => localStorage.getItem(key), TODOS_STORAGE_KEY)).toBe('[]');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});

for (const viewport of [{ width: 1440, height: 960 }, { width: 2560, height: 1370 }, { width: 900, height: 700 }]) {
  test(`todo stays within ${viewport.width}px and history scrolls independently`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.getByRole('button', { name: 'To-Do', exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    const stage = page.locator('.clothesline-stage');
    await expect.poll(() => stage.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
    await stage.scrollIntoViewIfNeeded();
    await expect(page.locator('.hanging-note').last()).toBeInViewport();
    await stage.evaluate(el => { el.scrollLeft = 0; });
    await stage.evaluate(el => { el.scrollLeft = el.scrollWidth; });
    await expect.poll(() => stage.evaluate(el => Math.abs(el.scrollWidth - el.clientWidth - el.scrollLeft))).toBeLessThanOrEqual(1);
    const composer = page.getByLabel('새 할 일 입력', { exact: true });
    await composer.scrollIntoViewIfNeeded();
    await expect(composer).toBeInViewport();
    await composer.fill('레이아웃 확인 할 일');
    await composer.press('Enter');
    await expect(page.getByRole('checkbox', { name: '레이아웃 확인 할 일 완료 체크' })).toBeVisible();
    await expect(composer).toBeFocused();
  });
}

test('short lists fit their children and long lists keep the composer outside the scroll area', async ({ page }) => {
  const today = formatDateKey();
  const items = [
    { id: 'parent', text: '상위 할 일', done: false, createdAtDate: today },
    { id: 'child', parentId: 'parent', text: '하위 할 일', done: false, createdAtDate: today },
  ];
  await page.addInitScript(({ key, items }) => localStorage.setItem(key, JSON.stringify(items)), { key: TODOS_STORAGE_KEY, items });
  await page.goto('/');
  await page.getByRole('button', { name: 'To-Do', exact: true }).click();
  const list = page.locator('.todo-items-list');
  expect(await list.evaluate(el => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
  await expect(page.getByRole('checkbox', { name: '하위 할 일 완료 체크' })).toBeInViewport({ ratio: 1 });
  const input = page.getByLabel('새 할 일 입력', { exact: true });
  for (let index = 0; index < 18; index++) {
    await input.fill(`추가 항목 ${index}`);
    await input.press('Enter');
  }
  expect(await list.evaluate(el => el.scrollHeight > el.clientHeight)).toBe(true);
  expect(await input.evaluate(el => el.closest('.todo-items-list') === null)).toBe(true);
  await list.evaluate(el => { el.scrollTop = el.scrollHeight; });
  await expect(page.getByRole('checkbox', { name: '추가 항목 17 완료 체크' })).toBeInViewport({ ratio: 1 });
  await expect(input).toBeInViewport({ ratio: 1 });
});

test('history periods drag without selecting a month and today restores the current year and month', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 700 });
  await page.goto('/?todoHistory=large');
  const years = page.getByRole('tablist', { name: '연도별 히스토리 선택' });
  const months = page.getByRole('tablist', { name: '월별 히스토리 선택' });
  const labels = await months.getByRole('tab').allTextContents();
  expect(labels.map(text => Number(text.match(/(\d+)월/)![1]))).toEqual(labels.map(text => Number(text.match(/(\d+)월/)![1])).sort((a, b) => a - b));
  await expect(years).toHaveCSS('scrollbar-width', 'none');
  await years.scrollIntoViewIfNeeded();
  const before = await years.evaluate(el => el.scrollLeft);
  const selected = await months.locator('[aria-selected="true"]').getAttribute('aria-label');
  const box = (await years.boundingBox())!;
  await page.mouse.move(box.x + 20, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 20, box.y + box.height / 2, { steps: 10 });
  await page.mouse.up();
  expect(await years.evaluate(el => el.scrollLeft)).toBeLessThan(before);
  await expect(years.locator('[aria-selected="true"]')).toHaveText('2020년');
  await years.getByRole('tab').first().click();
  await years.getByRole('tab').last().click();
  const today = formatDateKey();
  await expect(years.locator('[aria-selected="true"]')).toHaveText(`${today.slice(0, 4)}년`);
  await expect(months.locator('[aria-selected="true"]')).toHaveAttribute('aria-label', `${today.slice(0, 4)}년 ${Number(today.slice(5, 7))}월`);
  await expect(page.getByRole('button', { name: '오늘' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '이전 기록' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '최근으로' })).toHaveCount(0);
});
