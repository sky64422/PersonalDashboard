import { test, expect } from '@playwright/test';

test.describe('History Search (Option 1)', () => {
  test('filters timeline cards, highlights query, and clears seamlessly', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'To-Do', exact: true }).click();

    // Verify search box exists in History panel heading
    const searchBox = page.locator('.history-search-box');
    const searchInput = page.locator('.history-search-input');
    await expect(searchBox).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', '과거 기록 검색… (Esc)');

    // Initial state: HistoryPeriodPicker is visible, search status bar is not
    await expect(page.locator('.history-period-picker')).toBeVisible();
    await expect(page.locator('.history-search-status-bar')).not.toBeVisible();

    // Type search query
    await searchInput.fill('Atlas');

    // Search status bar replaces the picker
    await expect(page.locator('.history-period-picker')).not.toBeVisible();
    const statusBar = page.locator('.history-search-status-bar');
    await expect(statusBar).toBeVisible();
    await expect(statusBar.locator('.history-search-status-badge')).toHaveText('검색 결과');
    await expect(statusBar).toContainText('Atlas');
    await expect(statusBar).toContainText('일치 기록 발견');

    // Highlight mark tags are rendered
    const highlights = page.locator('.history-search-match');
    await expect(highlights.first()).toBeVisible();
    await expect(highlights.first()).toHaveText(/Atlas/i);

    // Cards have year badge during search
    const yearBadges = page.locator('.history-search-card-year');
    await expect(yearBadges.first()).toBeVisible();

    // Clear via the X button in search box
    const clearBtn = page.locator('.history-search-clear-btn');
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();

    // Restores default period picker
    await expect(searchInput).toHaveValue('');
    await expect(page.locator('.history-search-status-bar')).not.toBeVisible();
    await expect(page.locator('.history-period-picker')).toBeVisible();

    // Type query and clear via Escape key
    await searchInput.fill('OTA');
    await expect(page.locator('.history-search-status-bar')).toBeVisible();
    await searchInput.press('Escape');
    await expect(searchInput).toHaveValue('');
    await expect(page.locator('.history-search-status-bar')).not.toBeVisible();
    await expect(page.locator('.history-period-picker')).toBeVisible();

    // Empty search state when no records match
    await searchInput.fill('NonExistentKeywordXYZ');
    await expect(page.locator('.history-search-empty')).toBeVisible();
    await expect(page.locator('.history-empty-title')).toContainText('NonExistentKeywordXYZ');
    
    // Reset via empty state button
    const emptyResetBtn = page.locator('.history-search-empty-reset');
    await expect(emptyResetBtn).toBeVisible();
    await emptyResetBtn.click();
    await expect(searchInput).toHaveValue('');
    await expect(page.locator('.history-period-picker')).toBeVisible();
  });

  test('search works and renders cleanly in dark mode', async ({ page }) => {
    await page.goto('/');
    // Switch to dark mode (Midnight)
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });

    await page.getByRole('button', { name: 'To-Do', exact: true }).click();
    const searchInput = page.locator('.history-search-input');
    await searchInput.fill('Atlas');

    await expect(page.locator('.history-search-status-bar')).toBeVisible();
    const highlight = page.locator('.history-search-match').first();
    await expect(highlight).toBeVisible();

    // Reset via status bar reset button
    const resetBtn = page.locator('.history-search-reset-btn');
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();
    await expect(page.locator('.history-period-picker')).toBeVisible();
  });
});
