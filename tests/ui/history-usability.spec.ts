import { test, expect } from '@playwright/test';

test('long history cards expand and collapse without losing records or dragging', async ({ page }) => {
  await page.goto('/?todoHistory=large');
  const date = await page.locator('.hanging-note').filter({ has: page.getByRole('button', { name: /외 .*개 더 보기/ }) }).last().getAttribute('data-log-date');
  const note = page.locator(`.hanging-note[data-log-date="${date}"]`);
  const items = note.locator('.hanging-note-item');
  await expect(items).toHaveCount(5);
  const more = note.getByRole('button', { name: /외 .*개 더 보기/ });
  const remaining = Number((await more.textContent())!.match(/\d+/)![0]);
  await more.click();
  await expect(items).toHaveCount(5 + remaining);
  await expect(note.getByRole('button', { name: '접기', exact: true })).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.clothesline-stage')).not.toHaveClass(/is-dragging/);
  await note.getByRole('button', { name: '접기', exact: true }).click();
  await expect(items).toHaveCount(5);
  await expect(page.locator('.latest-stamp')).toHaveText('이달 마지막 기록');
});

for (const width of [800, 1440]) {
  test(`month geometry stays fixed with January only, October, and December at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 960 });
    let baseline: unknown;
    for (const count of [1, 10, 12]) {
      await page.goto('/');
      await page.evaluate(count => {
        localStorage.setItem('friday.todos.v4', JSON.stringify(Array.from({ length: count }, (_, i) => {
          const date = `2025-${String(i + 1).padStart(2, '0')}-15`;
          return { id: `sample-${i}`, text: `Record ${i}`, createdAtDate: date, completedAtDate: date, done: true };
        })));
      }, count);
      await page.reload();
      await page.getByRole('button', { name: 'To-Do', exact: true }).click();
      const months = page.locator('.history-month-row');
      await expect(months).toHaveCount(12);
      await expect(page.locator('.history-month-row:not(:disabled)')).toHaveCount(count);
      await expect(months.nth(count - 1)).toHaveAttribute('aria-selected', 'true');
      const geometry = await months.evaluateAll(tabs => tabs.map(tab => {
        const rect = tab.getBoundingClientRect();
        const rail = tab.parentElement!.getBoundingClientRect();
        return [rect.x - rail.x, rect.y - rail.y, rect.width, rect.height];
      }));
      if (baseline) expect(geometry).toEqual(baseline);
      else baseline = geometry;
      expect(new Set(geometry.map(rect => rect[1])).size).toBe(width === 800 ? 2 : 1);
      expect(await page.locator('.history-months-bar').evaluate(el => el.scrollWidth - el.clientWidth)).toBe(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
      if (count === 1) await expect(months.last()).toBeDisabled();
      if (count === 12) {
        await months.first().click();
        await expect(months.first()).toHaveAttribute('aria-selected', 'true');
        await page.screenshot({ path: `tmp/screenshots/history-fixed-months-${width}.png`, fullPage: true });
      }
    }
  });
}
