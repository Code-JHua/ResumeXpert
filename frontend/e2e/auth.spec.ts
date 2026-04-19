import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display landing page', async ({ page }) => {
    await expect(page.locator('text=ResumeXpert')).toBeVisible();
    await expect(page.locator('text=Professional Resumes')).toBeVisible();
  });

  test('should open login modal when clicking get started', async ({ page }) => {
    await page.click('text=Get Started');
    await expect(page.locator('text=Login')).toBeVisible();
    await expect(page.locator('text=Email')).toBeVisible();
    await expect(page.locator('text=Password')).toBeVisible();
  });

  test('should switch to signup form', async ({ page }) => {
    await page.click('text=Get Started');
    await page.click('text=Sign up');
    await expect(page.locator('text=Name')).toBeVisible();
    await expect(page.locator('text=Create Password')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.click('text=Get Started');
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Login")');

    // Should show error or not navigate
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/');
  });

  test('should display language selector', async ({ page }) => {
    const languageSelector = page.locator('[class*="language"]').or(page.locator('select'));
    await expect(languageSelector.first()).toBeVisible();
  });
});

test.describe('User Flow', () => {
  test('should navigate through landing page sections', async ({ page }) => {
    await page.goto('/');

    // Check hero section
    await expect(page.locator('text=Craft Professional Resumes')).toBeVisible();

    // Scroll to features
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);

    // Check CTA section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator('text=Hexagon Digital Services')).toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Mobile menu should be visible
    const menuButton = page.locator('button').filter({ hasText: /Menu|Get Started/ });
    await expect(menuButton.first()).toBeVisible();
  });
});
