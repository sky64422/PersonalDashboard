import { test, expect } from '@playwright/test';

test('board assigns each owned task once and filters a column without losing the layout', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Jira Tasks', exact: true }).click();
  const expected = [['Open', 3], ['Progress', 4], ['Resolved', 1], ['Closed', 1]] as const;
  for (const [name, count] of expected) {
    await expect(page.getByRole('region', { name, exact: true }).locator('.task-tile')).toHaveCount(count);
  }
  const keys = await page.locator('.tile-key').allTextContents();
  expect(new Set(keys).size).toBe(9);
  expect(keys).not.toContain('FW-201');
  await expect(page.locator('.tile-meta')).toHaveCount(0);
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

test('todo tab moves completed items to bottom and switches monthly clothesline history', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-26T12:00:00') });
  await page.goto('/');
  await expect(page.locator('.brand-name .brand-f')).toHaveText('F');
  await expect(page.getByRole('region', { name: '남아있는 TODO' })).toBeVisible();
  await page.getByRole('button', { name: 'To-Do', exact: true }).click();
  await expect(page.getByRole('region', { name: '히스토리', exact: true })).toBeVisible();

  const monthTabs = page.getByRole('tablist', { name: '월별 히스토리 선택' }).getByRole('tab');
  await expect(monthTabs).toHaveCount(12);
  const availableMonths = page.locator('.history-month-row:not(:disabled)');
  await expect(availableMonths.last()).toHaveAttribute('aria-selected', 'true');

  const notes = page.locator('.hanging-note');
  await expect(notes).toHaveCount(8);
  await expect(notes.last()).toHaveClass(/is-latest/);
  await expect(notes.last()).toContainText('이달 마지막 기록');

  await availableMonths.nth(1).click();
  await expect(availableMonths.nth(1)).toHaveAttribute('aria-selected', 'true');
  await expect(notes).toHaveCount(5);

  const input = page.getByLabel('새 할 일 입력', { exact: true });
  await input.fill('신규 보드 JTAG 디버거 점검');
  await input.press('Enter');
  const checkBtn = page.getByRole('checkbox', { name: '신규 보드 JTAG 디버거 점검 완료 체크' });
  await expect(checkBtn).toBeVisible();
  await checkBtn.click();
  await expect(checkBtn).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.todo-item-row').last()).toContainText('신규 보드 JTAG 디버거 점검');

  const parentCheck = page.getByRole('checkbox', { name: 'BLE 연결 끊김 복구 전략 투트랙 실험 완료 체크' });
  const trackBCheck = page.getByRole('checkbox', { name: 'B안: Supervision Timeout 4s 연장 안정성 실험 완료 체크' });
  await expect(parentCheck).toHaveAttribute('aria-checked', 'false');
  await trackBCheck.click();
  await expect(trackBCheck).toHaveAttribute('aria-checked', 'true');
  await expect(parentCheck).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.todo-item-row').last()).toContainText('BLE 연결 끊김 복구 전략 투트랙 실험');

  // 1) Bottom composer: create child and grandchild (하위의 하위) with Tab
  await input.fill('새 주제 항목');
  await input.press('Enter');
  await input.press('Tab'); // Indent to depth 1 (child)
  await input.fill('하위 트랙 테스트 항목');
  await input.press('Enter');
  await expect(page.locator('.todo-subitem-row').filter({ hasText: '하위 트랙 테스트 항목' })).toBeVisible();

  await input.press('Tab'); // Indent to depth 2 (grandchild / 하위의 하위)
  await input.fill('하위의 하위 테스트 항목');
  await input.press('Enter');
  await expect(page.locator('.todo-subitem-row').filter({ hasText: '하위의 하위 테스트 항목' })).toBeVisible();

  // Outdent back with Shift+Tab
  await input.press('Shift+Tab');
  await input.press('Shift+Tab');

  // 2) Test notepad inline editing on existing row and Enter line insertion
  const row = page.locator('.todo-subitem-row').filter({ hasText: '하위 트랙 테스트 항목' });
  const lineInput = row.getByLabel('할 일 내용 편집');
  await lineInput.click();
  await lineInput.fill('하위 트랙 테스트 항목 수정');
  await expect(page.locator('.todo-subitem-row').filter({ hasText: '하위 트랙 테스트 항목 수정' })).toBeVisible();
  await page.keyboard.press('Enter');
  // New line created right below at same level
  const activeInputs = page.locator('.todo-line-input:focus');
  await expect(activeInputs).toHaveCount(1);
  await page.keyboard.type('엔터로 바로 추가된 라인');
  await expect(page.locator('.todo-subitem-row').filter({ hasText: '엔터로 바로 추가된 라인' })).toBeVisible();
  // Backspacing to empty and pressing Backspace deletes the line
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  await expect(page.locator('.todo-subitem-row').filter({ hasText: '엔터로 바로 추가된 라인' })).toHaveCount(0);
});
