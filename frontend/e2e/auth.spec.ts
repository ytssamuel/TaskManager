import { test, expect } from '@playwright/test';

test.describe('TaskManager E2E', () => {
  const randomUser = `testuser${Date.now()}`;
  const randomEmail = `test${Date.now()}@example.com`;

  test('registration flow', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // Fill registration form
    await page.fill('input[id="username"]', randomUser);
    await page.fill('input[id="name"]', 'Test User');
    await page.fill('input[id="email"]', randomEmail);
    await page.fill('input[id="password"]', 'Test123456');
    await page.fill('input[id="confirmPassword"]', 'Test123456');

    // Submit
    await page.click('button[type="submit"]');

    // Wait for redirect to login or dashboard
    await page.waitForTimeout(2000);

    // Should either be logged in or redirected to login
    const url = page.url();
    expect(url).toMatch(/\/(login|dashboard)$/);
  });

  test('login flow', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Fill login form
    await page.fill('input[id="username"]', randomUser);
    await page.fill('input[id="password"]', 'Test123456');

    // Submit
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForTimeout(2000);

    // Should redirect to dashboard
    const url = page.url();
    expect(url).toContain('/dashboard');
  });

  test('unauthorized access redirect', async ({ page }) => {
    // Try to access protected route
    await page.goto('/projects');
    await page.waitForTimeout(1000);

    // Should redirect to login
    const url = page.url();
    expect(url).toContain('/login');
  });
});
