import { test, expect } from '@playwright/test';

/**
 * Sign Up Flow Tests
 * Tests user registration flow
 */
test.describe('Sign Up Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signup');
  });

  test('should display sign up form', async ({ page }) => {
    // Check heading
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();

    // Check form inputs
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByLabel(/confirm password/i)).toBeVisible();

    // Check terms checkbox
    await expect(page.getByLabel(/terms/i)).toBeVisible();

    // Check sign up button
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
  });

  test('should show password mismatch error', async ({ page }) => {
    // Fill form with mismatched passwords - use .first()
    await page.getByLabel(/full name/i).first().fill('Test User');
    await page.getByLabel(/email address/i).first().fill('test@example.com');
    await page.getByLabel(/^password$/i).first().fill('password123');
    await page.getByLabel(/confirm password/i).first().fill('different123');

    // Agree to terms
    await page.getByLabel(/terms/i).first().check();

    // Submit form
    await page.getByRole('button', { name: /create account/i }).click();

    // Should show error - use .first()
    await expect(page.getByText(/passwords do not match/i).first()).toBeVisible();
  });

  test('should show password too short error', async ({ page }) => {
    // Fill form with short password
    await page.getByLabel(/full name/i).fill('Test User');
    await page.getByLabel(/email address/i).fill('test@example.com');
    await page.getByLabel(/^password$/i).fill('short');
    await page.getByLabel(/confirm password/i).fill('short');

    // Agree to terms
    await page.getByLabel(/terms/i).check();

    // Submit form
    await page.getByRole('button', { name: /create account/i }).click();

    // Should show error
    await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible();
  });

  test('should show terms agreement required error', async ({ page }) => {
    // Fill form without agreeing to terms
    await page.getByLabel(/full name/i).fill('Test User');
    await page.getByLabel(/email address/i).fill('test@example.com');
    await page.getByLabel(/^password$/i).fill('password123');
    await page.getByLabel(/confirm password/i).fill('password123');

    // Don't agree to terms

    // Submit form
    await page.getByRole('button', { name: /create account/i }).click();

    // Should show error
    await expect(page.getByText(/agree to the terms/i)).toBeVisible();
  });

  test('should have link to sign in', async ({ page }) => {
    const signInLink = page.getByRole('link', { name: /sign in/i });
    await expect(signInLink).toBeVisible();

    // Check link destination
    await expect(signInLink).toHaveAttribute('href', '/auth/signin');
  });

  test('should navigate to sign in page', async ({ page }) => {
    await page.getByRole('link', { name: /sign in/i }).click();

    await expect(page).toHaveURL('/auth/signin');
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });

  test('should have terms and privacy links', async ({ page }) => {
    // Check terms link
    const termsLink = page.getByRole('link', { name: /terms of service/i });
    await expect(termsLink).toBeVisible();
    await expect(termsLink).toHaveAttribute('href', '/terms');

    // Check privacy link
    const privacyLink = page.getByRole('link', { name: /privacy policy/i });
    await expect(privacyLink).toBeVisible();
    await expect(privacyLink).toHaveAttribute('href', '/privacy');
  });

  test('should display Google OAuth button', async ({ page }) => {
    // Check for Google sign up option
    const googleButton = page.getByRole('button', { name: /sign up with google/i });
    await expect(googleButton).toBeVisible();

    // Check for Google icon
    await expect(googleButton.locator('svg')).toBeVisible();
  });

  test('should show password helper text', async ({ page }) => {
    const passwordInput = page.getByLabel(/^password$/i);

    // Check for helper text
    await expect(passwordInput).toBeVisible();
    const helperText = page.getByText(/must be at least 8 characters/i);
    await expect(helperText).toBeVisible();
  });

  test('should validate confirm password in real-time', async ({ page }) => {
    await page.getByLabel(/^password$/i).fill('password123');
    await page.getByLabel(/confirm password/i).fill('different');

    // Should show error immediately
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();

    // Fix the password
    await page.getByLabel(/confirm password/i).fill('password123');

    // Error should disappear
    await expect(page.getByText(/passwords do not match/i)).not.toBeVisible();
  });

  test('should handle form inputs correctly', async ({ page }) => {
    // Fill name
    await page.getByLabel(/full name/i).fill('John Doe');
    await expect(page.getByLabel(/full name/i)).toHaveValue('John Doe');

    // Fill email
    await page.getByLabel(/email address/i).fill('john@example.com');
    await expect(page.getByLabel(/email address/i)).toHaveValue('john@example.com');

    // Fill password
    await page.getByLabel(/^password$/i).fill('securepassword123');
    await expect(page.getByLabel(/^password$/i)).toHaveValue('securepassword123');

    // Fill confirm password
    await page.getByLabel(/confirm password/i).fill('securepassword123');
    await expect(page.getByLabel(/confirm password/i)).toHaveValue('securepassword123');
  });

  test('should have proper autocomplete attributes', async ({ page }) => {
    // Check name autocomplete
    await expect(page.getByLabel(/full name/i)).toHaveAttribute('autoComplete', 'name');

    // Check email autocomplete
    await expect(page.getByLabel(/email address/i)).toHaveAttribute('autoComplete', 'email');

    // Check password autocomplete
    await expect(page.getByLabel(/^password$/i)).toHaveAttribute('autoComplete', 'new-password');
    await expect(page.getByLabel(/confirm password/i)).toHaveAttribute('autoComplete', 'new-password');
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();

    // Check all elements are still visible
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
    await expect(page.getByLabel(/full name/i)).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByLabel(/^password$/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
  });

  test('should navigate back to home via logo', async ({ page }) => {
    await page.getByRole('link', { name: 'VoiceDraft' }).click();

    await expect(page).toHaveURL('/');
  });
});
