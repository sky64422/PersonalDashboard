import { test, expect } from '@playwright/test';

test('board animates entrance and reflow, settles idle and respects reduced motion', async ({ page }) => {
  await page.addInitScript(() => {
    const animate = Element.prototype.animate;
    (window as unknown as { boardMotion: unknown[] }).boardMotion = [];
    Element.prototype.animate = function (frames, options) {
      if (this.hasAttribute('data-task-id')) (window as unknown as { boardMotion: unknown[] }).boardMotion.push(frames);
      return animate.call(this, frames, options);
    };
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Jira Tasks', exact: true }).click();
  expect(await page.evaluate(() => (window as unknown as { boardMotion: unknown[] }).boardMotion.length)).toBeGreaterThan(0);
  await page.evaluate(() => {
    document.getAnimations().forEach(animation => animation.finish());
    (window as unknown as { boardMotion: unknown[] }).boardMotion = [];
  });
  await page.getByRole('button', { name: 'FW-284 숨기기', exact: true }).click();
  expect(await page.evaluate(() => (window as unknown as { boardMotion: unknown[] }).boardMotion.length)).toBeGreaterThan(0);
  await page.evaluate(() => document.getAnimations().forEach(animation => animation.finish()));
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length)).toBe(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => { (window as unknown as { boardMotion: unknown[] }).boardMotion = []; });
  await page.getByRole('button', { name: /숨긴 업무/ }).click();
  expect(await page.evaluate(() => (window as unknown as { boardMotion: unknown[] }).boardMotion.length)).toBe(0);
});
