/**
 * Test Helpers
 * Common utilities for Playwright tests
 */

import { Page, Locator } from '@playwright/test';

/**
 * Auth helper to set up mock authentication
 */
export async function mockAuth(page: Page, token: string = 'mock-token') {
  await page.evaluate((t) => {
    localStorage.setItem('access_token', t);
  }, token);
}

/**
 * Clear authentication
 */
export async function clearAuth(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('access_token');
    localStorage.clear();
  });
}

/**
 * Wait for element to be visible with timeout
 */
export async function waitForElement(
  locator: Locator,
  timeout: number = 5000
): Promise<boolean> {
  try {
    await locator.waitFor({ state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get text content of multiple elements
 */
export async function getTextContents(locator: Locator): Promise<string[]> {
  const count = await locator.count();
  const texts: string[] = [];

  for (let i = 0; i < count; i++) {
    const text = await locator.nth(i).textContent();
    if (text) texts.push(text);
  }

  return texts;
}

/**
 * Mock drafts data
 */
export const mockDrafts = [
  {
    id: 'draft-1',
    title: 'Test Draft 1',
    content: 'This is a test draft content.',
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'draft-2',
    title: 'Published Post',
    content: 'This is published content.',
    status: 'published',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/**
 * Mock user data
 */
export const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
};

/**
 * Common test credentials (for testing purposes only)
 * These should not be used in production
 */
export const testCredentials = {
  email: 'test@example.com',
  password: 'testpassword123',
  name: 'Test User',
};

/**
 * API route interceptors
 */
export function setupApiMocks(page: Page) {
  // Mock drafts API
  page.route('**/api/drafts', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockDrafts),
    });
  });

  // Mock single draft API
  page.route('**/api/drafts/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockDrafts[0]),
    });
  });
}

/**
 * Theme toggle helper
 */
export async function toggleTheme(page: Page) {
  const themeToggle = page.getByRole('button').filter({ hasText: /^(🌙|☀️)$/ });
  await themeToggle.click();
}

/**
 * Get current theme
 */
export async function getCurrentTheme(page: Page): Promise<'light' | 'dark'> {
  const html = page.locator('html');
  const hasDarkClass = await html.getAttribute('class');
  return hasDarkClass?.includes('dark') ? 'dark' : 'light';
}
