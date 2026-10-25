import { test, expect } from '@playwright/test';

test('overview opens task detail from prioritized task preview', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.overview-tasks .task-row')).toHaveCount(5);
  await page.locator('.overview-tasks').getByRole('button', { name: /FW-279/ }).click();
  await expect(page.getByRole('dialog')).toContainText('OTA 업데이트');
});

test('task filtering, reset, detail focus and persistent search', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Jira Tasks', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Closed', exact: true }).getByText('FW-200', { exact: true })).toBeVisible();
  await expect(page.getByText('FW-201', { exact: true })).toHaveCount(0);
  await page.getByLabel('업무 검색', { exact: true }).fill('롤백');
  const task = page.locator('.task-open').filter({ hasText: 'FW-279' });
  await task.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(task).toBeFocused();
  await page.getByRole('button', { name: 'Builds', exact: true }).click();
  await page.getByRole('button', { name: 'Jira Tasks', exact: true }).click();
  await expect(page.getByLabel('업무 검색', { exact: true })).toHaveValue('롤백');
  await page.getByLabel('업무 검색', { exact: true }).fill('not-found');
  await expect(page.getByText('검색 결과가 없어요')).toBeVisible();
  await page.getByRole('button', { name: '필터 초기화' }).click();
  await expect(page.getByLabel('업무 검색', { exact: true })).toHaveValue('');
});

test('build validation, cancellation and one demo submission', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Builds', exact: true }).click();
  await page.getByLabel('브랜치', { exact: true }).fill(' ');
  await page.getByRole('button', { name: '빌드 검토' }).click();
  await expect(page.getByRole('alert')).toContainText('브랜치');
  await page.getByLabel('브랜치', { exact: true }).fill('feature/demo-test');
  await page.getByRole('button', { name: '빌드 검토' }).click();
  await page.keyboard.press('Control+k');
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(page.getByRole('dialog')).toContainText('빌드 설정 확인');
  await page.getByRole('button', { name: '돌아가기' }).click();
  await expect(page.getByRole('table').getByText('feature/demo-test')).toHaveCount(0);
  await page.getByRole('button', { name: '빌드 검토' }).click();
  await page.getByRole('button', { name: '데모 빌드 추가' }).dblclick();
  await expect(page.getByRole('table').getByText('feature/demo-test')).toHaveCount(1);
  await expect(page.getByRole('status')).toContainText('실제 빌드');
});

test('firmware lookup and clipboard failure feedback', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('denied')) } }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Firmware', exact: true }).click();
  await page.getByLabel('펌웨어 검색', { exact: true }).fill('2.4.0');
  await page.getByRole('button', { name: /경로 복사/ }).click();
  await expect(page.getByRole('status')).toContainText('복사하지 못했습니다');
});

test('global search routes to task and overview firmware query transfers', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Control+k');
  await page.getByLabel('통합 검색어').fill('FW-279');
  await page.getByRole('option', { name: /FW-279/ }).click();
  await expect(page.getByRole('dialog')).toContainText('OTA 업데이트');
  await expect(page.getByRole('combobox')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Jira Tasks', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Overview', exact: true }).click();
  await page.getByLabel('빠른 펌웨어 검색').fill('2.4.0');
  await page.getByLabel('빠른 펌웨어 검색').press('Enter');
  await expect(page.getByLabel('펌웨어 검색', { exact: true })).toHaveValue('2.4.0');
});

test('responsive and reduced motion rendering without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  for (const size of [{ width: 1440, height: 960 }, { width: 900, height: 700 }]) {
    await page.setViewportSize(size);
    for (const view of ['Overview', 'Jira Tasks', 'Builds', 'Firmware']) {
      await page.getByRole('button', { name: view, exact: true }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
  expect(errors).toEqual([]);
});
