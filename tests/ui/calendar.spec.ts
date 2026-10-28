import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-26T12:00:00+09:00'));
  await page.goto('/');
});

test('Calendar follows Overview and supports local event CRUD across reloads without external data requests', async ({ page }) => {
  const external: string[] = [];
  page.on('request', request => { if (['fetch', 'xhr'].includes(request.resourceType()) && /^https?:/.test(request.url()) && !request.url().startsWith('http://127.0.0.1:1420')) external.push(request.url()); });
  await expect(page.locator('nav .nav-item').nth(1)).toHaveAccessibleName('Calendar');
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  await page.getByRole('button', { name: '일정 추가', exact: true }).click();
  await page.getByLabel('제목', { exact: true }).fill('디자인 리뷰');
  await page.getByLabel('종일', { exact: true }).uncheck();
  await page.getByLabel('시작', { exact: true }).fill('14:00');
  await page.getByLabel('종료', { exact: true }).fill('15:00');
  await page.getByLabel('메모', { exact: true }).fill('이번 주 화면 확인');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  await page.getByRole('button', { name: /디자인 리뷰 일정 수정/ }).click();
  await expect(page.getByLabel('메모', { exact: true })).toHaveValue('이번 주 화면 확인');
  await page.getByLabel('제목', { exact: true }).fill('최종 리뷰');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await page.getByRole('button', { name: /최종 리뷰 일정 수정/ }).click();
  await page.getByRole('button', { name: '삭제', exact: true }).click();
  await page.getByRole('button', { name: '일정 삭제', exact: true }).click();
  await expect(page.getByText('아직 일정이 없어요')).toBeVisible();
  expect(external).toEqual([]);
});

test('keyboard crosses month boundaries and unknown holiday years remain explicit', async ({ page }) => {
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  await page.getByLabel('월 선택', { exact: true }).fill('2024-02');
  const first = page.locator('[data-date="2024-02-01"]');
  await first.focus();
  await first.press('ArrowLeft');
  await expect(page.locator('[data-date="2024-01-31"]')).toBeFocused();
  await page.keyboard.press('PageDown');
  await expect(page.locator('[data-date="2024-02-29"]')).toBeFocused();
  await page.getByLabel('월 선택', { exact: true }).fill('2035-01');
  await expect(page.getByText('이 연도의 공휴일 데이터는 아직 제공되지 않습니다.')).toBeVisible();
  await page.getByRole('button', { name: '오늘', exact: true }).click();
  await expect(page.locator('[data-date="2026-10-26"]')).toHaveAttribute('aria-pressed', 'true');
});

test('corrupt storage stays intact and failed saves retain the draft', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('friday.calendar.v1', '{broken'));
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('편집을 잠갔습니다');
  await expect(page.getByRole('button', { name: '일정 추가', exact: true })).toBeDisabled();
  expect(await page.evaluate(() => localStorage.getItem('friday.calendar.v1'))).toBe('{broken');
  await page.evaluate(() => localStorage.removeItem('friday.calendar.v1'));
  await page.getByRole('button', { name: '다시 불러오기', exact: true }).click();
  await page.getByRole('button', { name: '일정 추가', exact: true }).click();
  await page.getByLabel('제목', { exact: true }).fill('저장 실패 확인');
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Full', 'QuotaExceededError'); }; });
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('저장하지 못했습니다');
  await expect(page.getByLabel('제목', { exact: true })).toHaveValue('저장 실패 확인');
});

test('crowded dates, both themes and narrow windows stay usable', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('friday.calendar.v1', JSON.stringify({ version: 1, events: Array.from({ length: 6 }, (_, i) => ({ id: String(i), title: `일정 ${i} — 긴 제목도 칸을 넘지 않도록 확인합니다`, date: '2026-10-26', allDay: true, start: '', end: '', notes: '' })) })));
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  await expect(page.locator('[data-date="2026-10-26"]').locator('..')).toContainText('+4개');
  await expect(page.locator('.calendar-agenda-event')).toHaveCount(6);
  for (const theme of ['Midnight', 'Daylight']) {
    await page.getByRole('button', { name: '워크스페이스 설정', exact: true }).click();
    await page.getByRole('radio', { name: new RegExp(theme) }).check();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    for (const width of [1440, 800]) {
      await page.setViewportSize({ width, height: 960 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.mouse.move(0, 0);
      await page.screenshot({ path: `tmp/screenshots/calendar-${theme}-${width}.png`, fullPage: true });
    }
  }
});

test('works with external connections blocked and preserves cancelled drafts and invalid times', async ({ page }) => {
  await page.route(/^https:\/\//, route => route.abort());
  await page.reload();
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  await page.getByRole('button', { name: '일정 추가', exact: true }).click();
  await page.waitForTimeout(300);
  await page.locator('.dialog-content').screenshot({ path: 'tmp/screenshots/event-modal-compact-light.png' });
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: '워크스페이스 설정', exact: true }).click();
  await page.getByRole('radio', { name: /Midnight/ }).check();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  await page.getByRole('button', { name: '일정 추가', exact: true }).click();
  await page.waitForTimeout(300);
  await page.locator('.dialog-content').screenshot({ path: 'tmp/screenshots/event-modal-compact-dark.png' });
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: '워크스페이스 설정', exact: true }).click();
  await page.getByRole('radio', { name: /Daylight/ }).check();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  await page.getByRole('button', { name: '일정 추가', exact: true }).click();
  await page.getByLabel('제목', { exact: true }).fill('오프라인 일정');
  await page.keyboard.press('Escape');
  await expect(page.getByText('저장하지 않은 변경이 있습니다.')).toBeVisible();
  await page.getByRole('button', { name: '계속 편집', exact: true }).click();
  await page.getByLabel('종일', { exact: true }).uncheck();
  await page.getByLabel('종료', { exact: true }).fill('08:00');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('종료는 시작보다 늦어야');
  await page.getByLabel('종료', { exact: true }).fill('10:00');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  await expect(page.getByRole('button', { name: /오프라인 일정 일정 수정/ })).toBeVisible();
});

test('a concurrent update cannot be overwritten by an open editor', async ({ page }) => {
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  await page.getByRole('button', { name: '일정 추가', exact: true }).click();
  await page.waitForTimeout(300);
  await page.locator('.dialog-content').screenshot({ path: 'tmp/screenshots/event-modal-compact-light.png' });
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: '워크스페이스 설정', exact: true }).click();
  await page.getByRole('radio', { name: /Midnight/ }).check();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  await page.getByRole('button', { name: '일정 추가', exact: true }).click();
  await page.waitForTimeout(300);
  await page.locator('.dialog-content').screenshot({ path: 'tmp/screenshots/event-modal-compact-dark.png' });
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: '워크스페이스 설정', exact: true }).click();
  await page.getByRole('radio', { name: /Daylight/ }).check();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  await page.getByRole('button', { name: '일정 추가', exact: true }).click();
  await page.getByLabel('제목', { exact: true }).fill('내 일정');
  const other = JSON.stringify({ version: 1, events: [{ id: 'other', title: '다른 창 일정', date: '2026-10-26', allDay: true, start: '', end: '', notes: '' }] });
  await page.evaluate(value => localStorage.setItem('friday.calendar.v1', value), other);
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('저장하지 못했습니다');
  await expect(page.getByLabel('제목', { exact: true })).toHaveValue('내 일정');
  expect(await page.evaluate(() => localStorage.getItem('friday.calendar.v1'))).toBe(other);
  await page.getByRole('button', { name: '새 일정으로 저장', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.calendar-agenda-event')).toHaveCount(2);
});

test('saving waits for the cross-window storage lock before reading or writing', async ({ page }) => {
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  await page.getByRole('button', { name: '일정 추가', exact: true }).click();
  await page.waitForTimeout(300);
  await page.locator('.dialog-content').screenshot({ path: 'tmp/screenshots/event-modal-compact-light.png' });
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: '워크스페이스 설정', exact: true }).click();
  await page.getByRole('radio', { name: /Midnight/ }).check();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  await page.getByRole('button', { name: '일정 추가', exact: true }).click();
  await page.waitForTimeout(300);
  await page.locator('.dialog-content').screenshot({ path: 'tmp/screenshots/event-modal-compact-dark.png' });
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: '워크스페이스 설정', exact: true }).click();
  await page.getByRole('radio', { name: /Daylight/ }).check();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  await page.getByRole('button', { name: '일정 추가', exact: true }).click();
  await page.getByLabel('제목', { exact: true }).fill('순차 저장');
  await page.evaluate(async () => {
    await new Promise<void>(ready => {
      void navigator.locks.request('friday.calendar.v1', async () => {
        await new Promise<void>(release => { (window as any).releaseCalendarLock = release; ready(); });
      });
    });
  });
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(page.getByRole('button', { name: '저장', exact: true })).toBeDisabled();
  expect(await page.evaluate(() => localStorage.getItem('friday.calendar.v1'))).toBeNull();
  await page.evaluate(() => (window as any).releaseCalendarLock());
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '순차 저장 일정 수정', exact: true })).toBeVisible();
});

test('overlapping holidays and crowded event previews stay inside the day cell', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('friday.calendar.v1', JSON.stringify({ version: 1, events: Array.from({ length: 6 }, (_, i) => ({ id: String(i), title: `휴일 일정 ${i}`, date: '2025-05-05', allDay: true, start: '', end: '', notes: '' })) })));
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  await page.getByLabel('월 선택', { exact: true }).fill('2025-05');
  const day = page.locator('[data-date="2025-05-05"]');
  await day.click();
  await expect(page.locator('.calendar-holiday')).toHaveCount(2);
  const bounds = await day.evaluate(element => ({ bottom: element.getBoundingClientRect().bottom, more: element.parentElement!.querySelector('.calendar-more')!.getBoundingClientRect().bottom }));
  expect(bounds.more).toBeLessThanOrEqual(bounds.bottom);
  const addTop = (await page.locator('.calendar-cell-quick-add').boundingBox())!.y;
  expect(bounds.more).toBeLessThanOrEqual(addTop);
});

test('tall calendar uses the workspace and holiday labels remain readable', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1360 });
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  const grid = page.getByRole('grid');
  expect((await grid.boundingBox())!.height).toBeGreaterThan(450);
  const holiday = page.locator('[data-date="2026-10-05"] .calendar-holiday-name');
  expect(await holiday.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  expect(await page.locator('.calendar-day-number').first().evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(14);
  for (const theme of ['Daylight', 'Midnight']) {
    await page.getByRole('button', { name: '워크스페이스 설정', exact: true }).click();
    await page.getByRole('radio', { name: new RegExp(theme) }).check();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.mouse.move(0, 0);
    await page.screenshot({ path: `tmp/screenshots/calendar-refined-${theme}-1280.png`, fullPage: true });
  }
});

test('X close button dismisses immediately without confirmation even if dirty, and cell click reveals quick add button', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1360 });
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();

  // Test cell click and quick add button
  const cell = page.locator('[data-date="2026-10-26"]');
  await cell.click();
  const quickAdd = page.locator('.calendar-cell-quick-add');
  await expect(quickAdd).toBeVisible();
  await expect(quickAdd).toContainText('일정 추가');

  // Agenda panel with 3D convex glass & seasonal backdrop
  const agenda = page.locator('.calendar-agenda');
  await expect(agenda).toBeVisible();
  await expect(agenda).toContainText('26');
  await expect(agenda.getByRole('button', { name: '이 날짜에 추가' })).toHaveCount(0);

  // Take close-up screenshot of the agenda panel & hero card
  await page.locator('.calendar-agenda').screenshot({ path: 'tmp/screenshots/calendar-agenda-hero-panel.png' });
  await cell.locator('..').screenshot({ path: 'tmp/screenshots/calendar-cell-selected-quickadd.png' });

  // Click quick add button to open modal
  await quickAdd.click();
  await expect(page.getByRole('dialog')).toBeVisible();

  // Fill in dirty title
  await page.getByLabel('제목', { exact: true }).fill('즉시 닫기 테스트');

  // Click 'X' close button (aria-label="닫기")
  await page.getByRole('button', { name: '닫기', exact: true }).click();

  // MUST dismiss immediately without showing "저장하지 않은 변경이 있습니다."
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('저장하지 않은 변경이 있습니다.')).toHaveCount(0);
});

test('4 vertical landscapes rotate every 30 minutes in a Round Robin cycle', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1360 });
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();

  const backdrop = page.locator('.agenda-seasonal-backdrop');
  await expect(backdrop).toBeVisible();

  // 1. Initial 30-min slot (12:00 KST): autumn-reed-ridge (가을 1: 노을빛 가을 호수)
  await expect(backdrop).toHaveClass(/season-autumn/);
  await expect(backdrop).toHaveClass(/landscape-autumn-reed-ridge/);
  await page.locator('.calendar-agenda').screenshot({ path: 'tmp/screenshots/calendar-landscape-autumn-today.png' });

  // 2. Rotate after 30 minutes (12:30 KST): winter-snow-mountain (겨울 1: 새벽 설산과 침엽수림)
  await page.clock.setFixedTime(new Date('2026-10-26T12:30:00+09:00'));
  await page.clock.runFor(11000);
  await expect(backdrop).toHaveClass(/season-winter/);
  await expect(backdrop).toHaveClass(/landscape-winter-snow-mountain/);
  await page.locator('.calendar-agenda').screenshot({ path: 'tmp/screenshots/calendar-landscape-winter.png' });

  // 3. Rotate after 30 minutes (13:00 KST): spring-blossom-tunnel (봄 1: 화사한 벚꽃 터널과 햇살)
  await page.clock.setFixedTime(new Date('2026-10-26T13:00:00+09:00'));
  await page.clock.runFor(11000);
  await expect(backdrop).toHaveClass(/season-spring/);
  await expect(backdrop).toHaveClass(/landscape-spring-blossom-tunnel/);
  await page.locator('.calendar-agenda').screenshot({ path: 'tmp/screenshots/calendar-landscape-spring.png' });

  // 4. Rotate after 30 minutes (13:30 KST): summer-rain-temple (여름 1: 청량한 에메랄드빛 여름 바다)
  await page.clock.setFixedTime(new Date('2026-10-26T13:30:00+09:00'));
  await page.clock.runFor(11000);
  await expect(backdrop).toHaveClass(/season-summer/);
  await expect(backdrop).toHaveClass(/landscape-summer-rain-temple/);
  await page.locator('.calendar-agenda').screenshot({ path: 'tmp/screenshots/calendar-landscape-summer.png' });

  // 5. Rotate after 30 minutes (14:00 KST): completes the round-robin cycle back to autumn-reed-ridge
  await page.clock.setFixedTime(new Date('2026-10-26T14:00:00+09:00'));
  await page.clock.runFor(11000);
  await expect(backdrop).toHaveClass(/season-autumn/);
  await expect(backdrop).toHaveClass(/landscape-autumn-reed-ridge/);
});

test('landscape picker cycles all scenes without changing the selected day or agenda', async ({ page }) => {
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  const backdrop = page.locator('.agenda-seasonal-backdrop');
  const next = page.getByRole('button', { name: '다음 배경', exact: true });
  const previous = page.getByRole('button', { name: '이전 배경', exact: true });
  await expect(next).toBeVisible();
  const original = await backdrop.getAttribute('class');
  const seen = new Set([original]);
  for (let i = 0; i < 4; i++) {
    const cls = await backdrop.getAttribute('class');
    const match = cls.match(/landscape-([a-z-]+)/);
    const id = match ? match[1] : ('scene-' + i);
    await page.locator('.calendar-agenda').screenshot({ path: `tmp/screenshots/landscape-${id}.png` });
    seen.add(cls);
    if (i < 3) await next.click();
  }
  expect(seen.size).toBe(4);
  await next.click();
  await expect(backdrop).toHaveAttribute('class', original!);
  await previous.focus();
  await page.keyboard.press('Enter');
  await expect(backdrop).not.toHaveAttribute('class', original!);
  await next.click();
  await expect(backdrop).toHaveAttribute('class', original!);
  await expect(page.locator('[data-date="2026-10-26"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('아직 일정이 없어요')).toBeVisible();
  await page.setViewportSize({ width: 800, height: 900 });
  await expect(next).toBeVisible();
  await expect(previous).toBeVisible();
});

test('month picker jumps between years and months and closes with Escape', async ({ page }) => {
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  const trigger = page.getByRole('button', { name: /연도와 월 선택/ });
  const gridBounds = (await page.getByRole('grid').boundingBox())!;
  const controlsBounds = (await page.locator('.calendar-stepper').boundingBox())!;
  expect(Math.abs(gridBounds.x + gridBounds.width / 2 - controlsBounds.x - controlsBounds.width / 2)).toBeLessThan(2);
  await trigger.click();
  await page.screenshot({ path: 'tmp/screenshots/calendar-month-picker.png' });
  await page.getByRole('button', { name: '다음 연도', exact: true }).click();
  await page.getByRole('button', { name: '3월', exact: true }).click();
  await expect(page.getByRole('grid', { name: '2027년 3월' })).toBeVisible();
  await trigger.click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: '연도와 월 선택' })).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('today remains identifiable when another date is selected', async ({ page }) => {
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  await page.locator('[data-date="2026-10-25"]').click();
  await expect(page.locator('[data-date="2026-10-26"]')).toHaveAttribute('aria-current', 'date');
  await expect(page.locator('[data-date="2026-10-26"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-date="2026-10-25"]')).toHaveAttribute('aria-pressed', 'true');
  const today = page.locator('[data-date="2026-10-26"]');
  await expect(today).toHaveCSS('border-top-color', 'rgba(0, 0, 0, 0)');
  const selectedNumber = page.locator('[data-date="2026-10-25"] .calendar-day-number');
  await expect(selectedNumber).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(today.locator('.calendar-day-number')).toHaveCSS('background-image', 'none');
  expect(await today.evaluate(el => getComputedStyle(el).backgroundColor)).toBe(await page.locator('[data-date="2026-10-27"]').evaluate(el => getComputedStyle(el).backgroundColor));
  await page.screenshot({ path: 'tmp/screenshots/calendar-selected-and-today.png' });
});

test('upcoming highlights stay based on today while navigating months', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('friday.calendar.v1', JSON.stringify({ version: 1, events: [
    { id: 'past', title: '지난 일정', date: '2026-10-25', allDay: true, start: '', end: '', notes: '' },
    { id: 'future', title: '다음 달 일정', date: '2026-11-10', allDay: true, start: '', end: '', notes: '' },
  ] })));
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  const list = page.locator('.calendar-dday-list').first();
  await expect(list).toContainText('다음 달 일정');
  await expect(page.locator('.calendar-dday-list').nth(1)).toContainText('크리스마스');
  await expect(page.locator('.calendar-dday-list').nth(1)).toContainText('신년');
  await expect(list).not.toContainText('지난 일정');
  await page.getByRole('button', { name: '이전 달', exact: true }).click();
  await expect(list).toContainText('다음 달 일정');
  await list.getByRole('button', { name: /다음 달 일정/ }).press('Enter');
  await expect(page.locator('[data-date="2026-11-10"]')).toBeFocused();
});

test('crowded selected dates keep week heights and agenda cards compact', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('friday.calendar.v1', JSON.stringify({ version: 1, events: Array.from({ length: 3 }, (_, i) => ({ id: String(i), title: `일정 ${i}`, date: '2026-10-26', allDay: true, start: '', end: '', notes: '' })) })));
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  const heights = await page.locator('.calendar-week').evaluateAll(rows => rows.map(row => row.getBoundingClientRect().height));
  expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(2);
  const gridBox = (await page.locator('.calendar-grid').boundingBox())!;
  const agendaBox = (await page.locator('.calendar-agenda-inner').boundingBox())!;
  expect(Math.abs(gridBox.height - agendaBox.height)).toBeLessThan(2);
  await page.locator('[data-date="2026-10-27"]').click();
  expect(Math.abs((await page.locator('.calendar-grid').boundingBox())!.height - gridBox.height)).toBeLessThan(2);
  expect(Math.abs((await page.locator('.calendar-agenda-inner').boundingBox())!.height - agendaBox.height)).toBeLessThan(2);
  await page.locator('[data-date="2026-10-26"] .calendar-day-number').click();
  const cards = page.locator('.calendar-agenda-event');
  await expect(cards).toHaveCount(3);
  expect((await cards.first().boundingBox())!.height).toBeLessThan(100);
  await expect(page.locator('[data-date="2026-10-26"]').locator('..').locator('.calendar-more')).toBeVisible();
  const moreBottom = await page.locator('[data-date="2026-10-26"]').locator('..').locator('.calendar-more').evaluate(el => el.getBoundingClientRect().bottom);
  expect(moreBottom).toBeLessThanOrEqual((await page.locator('.calendar-cell-quick-add').boundingBox())!.y);
  await page.screenshot({ path: 'tmp/screenshots/calendar-crowded-balanced.png' });
});

test('a crowded six-week month keeps its selected date controls separate', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('friday.calendar.v1', JSON.stringify({ version: 1, events: Array.from({ length: 3 }, (_, i) => ({ id: String(i), title: `일정 ${i}`, date: '2026-05-20', allDay: true, start: '', end: '', notes: '' })) })));
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  await page.getByLabel('월 선택', { exact: true }).fill('2026-05');
  await page.locator('[data-date="2026-05-20"] .calendar-day-number').click();
  await expect(page.locator('.calendar-week')).toHaveCount(6);
  const more = page.locator('[data-date="2026-05-20"]').locator('..').locator('.calendar-more');
  await expect(more).toContainText('+2개');
  await page.locator('.calendar-cell-quick-add').evaluate(async el => { await Promise.all(el.getAnimations().map(animation => animation.finished)); });
  expect((await more.boundingBox())!.y + (await more.boundingBox())!.height).toBeLessThanOrEqual((await page.locator('.calendar-cell-quick-add').boundingBox())!.y);
});

test('upcoming events and holidays have separate cards while saved memos remain intact', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem('friday.calendar.memo.2026-10', '기존 메모');
    localStorage.setItem('friday.calendar.v1', JSON.stringify({ version: 1, events: [{ id: 'upcoming', title: '예정 회의', date: '2026-11-10', allDay: true, start: '', end: '', notes: '' }] }));
  });
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  const cards = page.locator('.calendar-bottom-dashboard > article');
  await expect(cards.nth(0)).toContainText('다가오는 일정들');
  await expect(cards.nth(0)).toContainText('예정 회의');
  await expect(cards.nth(0)).not.toContainText('크리스마스');
  await expect(cards.nth(1)).toContainText('다가오는 공휴일들');
  await expect(cards.nth(1)).toContainText('크리스마스');
  await expect(cards.nth(1)).not.toContainText('예정 회의');
  await expect(cards.nth(2)).toContainText('월간 일정 리듬');
  await expect(page.getByLabel('10월 메모')).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem('friday.calendar.memo.2026-10'))).toBe('기존 메모');
});

test('hovering upcoming items does not create horizontal overflow', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('friday.calendar.v1', JSON.stringify({ version: 1, events: Array.from({ length: 6 }, (_, i) => ({ id: String(i), title: `아주 긴 일정 제목 ${i} 가로 스크롤이 생기지 않아야 합니다`, date: '2026-11-10', allDay: true, start: '', end: '', notes: '' })) })));
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  for (const [index, list] of (await page.locator('.calendar-dday-list').all()).entries()) {
    await list.locator('.calendar-dday-item').first().hover();
    await list.locator('.calendar-dday-item').first().evaluate(async el => { await Promise.all(el.getAnimations().map(animation => animation.finished)); });
    expect(await list.evaluate(el => el.scrollWidth - el.clientWidth)).toBe(0);
    await list.screenshot({ path: `tmp/screenshots/calendar-hover-${index}.png` });
  }
});

test('agenda cards show time above the title and preserve details in the editor', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('friday.calendar.v1', JSON.stringify({ version: 1, events: [{ id: 'timed', title: '길이가 긴 일정 제목 확인', date: '2026-10-26', allDay: false, start: '09:00', end: '10:00', notes: '상세 메모' }] })));
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  const card = page.locator('.calendar-agenda-event');
  const title = (await card.locator('strong').boundingBox())!;
  const time = (await card.locator('.calendar-event-time').boundingBox())!;
  expect(time.y + time.height).toBeLessThanOrEqual(title.y);
  await expect(card.locator('.calendar-event-note')).toContainText('상세 메모');
  await card.click();
  await expect(page.getByLabel('메모', { exact: true })).toHaveValue('상세 메모');
});

test('cell event opens its editor and chosen color survives reload', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('friday.calendar.v1', JSON.stringify({ version: 1, events: [{ id: 'legacy', title: '기존 일정', date: '2026-10-26', allDay: true, start: '', end: '', notes: '' }] })));
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  await page.getByRole('button', { name: '달력에서 기존 일정 수정', exact: true }).click();
  await page.getByRole('radio', { name: '파랑', exact: true }).check();
  await page.locator('.calendar-editor').screenshot({ path: 'tmp/screenshots/calendar-event-colors.png' });
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  const preview = page.locator('.calendar-cell').filter({ has: page.locator('[data-date="2026-10-26"]') }).getByRole('button', { name: '달력에서 기존 일정 수정', exact: true });
  await expect(preview).toBeVisible();
  await expect(preview).toHaveAttribute('data-color', 'blue');
  await expect(preview).toHaveCSS('border-left-color', 'rgb(75, 142, 240)');
  await preview.click();
  await expect(page.getByRole('radio', { name: '파랑', exact: true })).toBeChecked();
});

test('an event on an unselected date opens directly from the calendar', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('friday.calendar.v1', JSON.stringify({ version: 1, events: [{ id: 'other-day', title: '다른 날 일정', date: '2026-10-29', allDay: true, start: '', end: '', notes: '' }] })));
  await page.getByRole('button', { name: 'Calendar', exact: true }).click();
  const preview = page.getByRole('button', { name: '달력에서 다른 날 일정 수정', exact: true });
  await preview.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('제목', { exact: true })).toHaveValue('다른 날 일정');
  await expect(page.locator('[data-date="2026-10-29"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('radio', { name: '기본', exact: true })).toBeChecked();
});
