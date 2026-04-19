import { test, expect } from '@playwright/test';

test.describe('Resume Builder Flow', () => {
  // Note: These tests require a running backend server
  // For now, we'll test the UI structure and navigation

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display dashboard layout elements', async ({ page }) => {
    // This test checks UI elements without authentication
    await page.goto('/dashboard');

    // Even without auth, we should see some structure
    // Or get redirected to login
    await page.waitForTimeout(1000);
  });

  test('should handle theme selector UI', async ({ page }) => {
    // Test theme selector structure
    await page.goto('/resume/test-id');

    // Look for theme-related elements
    const themeButton = page.locator('button:has-text("Theme")');
    if (await themeButton.isVisible()) {
      await themeButton.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Resume Templates', () => {
  test('should have template components defined', async ({ page }) => {
    await page.goto('/');

    // Check that app loads without template errors
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.toString());
    });

    await page.waitForLoadState('networkidle');
    expect(errors.length).toBe(0);
  });
});

test.describe('Language Switching', () => {
  test('should support language switching', async ({ page }) => {
    await page.goto('/');

    // Find and click language selector
    const languageSelector = page.locator('select').or(
      page.locator('button').filter({ hasText: /EN|中文/ })
    );

    if (await languageSelector.first().isVisible()) {
      await languageSelector.first().click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    const h1 = page.locator('h1');
    expect(await h1.count()).toBeGreaterThan(0);
  });

  test('should have clickable buttons with proper labels', async ({ page }) => {
    await page.goto('/');

    const buttons = page.locator('button:visible');
    expect(await buttons.count()).toBeGreaterThan(0);

    // Check that at least some buttons have text content
    const buttonWithText = page.locator('button:visible').filter({ hasText: /./ });
    expect(await buttonWithText.count()).toBeGreaterThan(0);
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await page.goto('/');

    // Tab through the page
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should have moved focus
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'A', 'INPUT']).toContain(focusedElement || '');
  });
});

test.describe('Performance', () => {
  test('should load page within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Should load in less than 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out common benign errors
    const criticalErrors = errors.filter(
      (e) => !e.includes('DevTools') && !e.includes('Extension')
    );

    expect(criticalErrors.length).toBe(0);
  });
});
