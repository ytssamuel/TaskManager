import { test, expect } from '@playwright/test';

test.describe('TaskManager Frontend', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Check if page loaded
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check for any console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });
  });

  test('login page works', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
    
    // Check login form exists
    const emailInput = await page.locator('input[type="email"]').count();
    const passwordInput = await page.locator('input[type="password"]').count();
    
    console.log('Email input found:', emailInput > 0);
    console.log('Password input found:', passwordInput > 0);
  });
});
