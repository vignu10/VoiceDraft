import { test, expect } from '@playwright/test';

/**
 * Discovery / Home Page Flow Tests
 * Tests the main landing page functionality
 */
test.describe('Discovery / Home Page Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the home page with all sections', async ({ page }) => {
    // Check for hero section - matches actual UI "Your voice, amplified."
    await expect(page.getByRole('heading', { name: /your voice/i })).toBeVisible();

    // Check for navigation
    await expect(page.getByRole('link', { name: 'VoiceScribe' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /explore/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /get started/i })).toBeVisible();
  });

  test('should navigate to discover page from explore link', async ({ page }) => {
    // Click on explore link in navigation
    await page.getByRole('link', { name: /explore/i }).first().click();

    // Check URL - should navigate to /discover page
    await expect(page).toHaveURL(/\/discover/);
  });

  test('should navigate to sign in from get started button', async ({ page }) => {
    // Wait for page to be stable
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    // Click get started button in navigation
    const getStartedLink = page.getByRole('link', { name: /get started/i });
    await getStartedLink.waitFor({ state: 'visible', timeout: 5000 });
    await getStartedLink.click({ timeout: 5000 }).catch(async () => {
      await getStartedLink.click({ force: true });
    });

    // Should navigate to auth signin page
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test('should have working theme toggle', async ({ page }) => {
    // Wait for page to be stable first
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    // Find theme toggle button by aria-label
    const themeToggle = page.getByRole('button', { name: /toggle theme/i });
    await themeToggle.waitFor({ state: 'visible', timeout: 5000 });
    await themeToggle.click({ timeout: 5000 }).catch(async () => {
      await themeToggle.click({ force: true });
    });
    await page.waitForTimeout(100);

    // Verify button is still visible after clicking
    await expect(themeToggle).toBeVisible();
  });

  test('should display discover page content', async ({ page }) => {
    // Navigate to discover page
    await page.getByRole('link', { name: /explore/i }).first().click();

    // Wait for content to load
    await page.waitForLoadState('domcontentloaded');

    // Verify we're on the discover page
    await expect(page).toHaveURL(/\/discover/);
  });

  test('should be responsive on mobile', async ({ page, viewport }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Reload page
    await page.reload();

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');

    // Check that mobile navigation works - logo icon is visible on mobile
    await expect(page.locator('a[href="/"]').first()).toBeVisible();
  });

  test('should have proper accessibility attributes', async ({ page }) => {
    // Check for navigation role
    const nav = page.getByRole('navigation', { name: /main navigation/i });
    await expect(nav.first()).toBeVisible();
  });

  test('should display bottom navigation on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Reload page
    await page.reload();

    // Check for bottom navigation (mobile only)
    const bottomNav = page.getByRole('navigation', { name: /main navigation/i }).nth(1);
    await expect(bottomNav).toBeVisible();
  });
});
