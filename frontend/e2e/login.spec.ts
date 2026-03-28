import { test, expect } from '@playwright/test';

test('login flow', async ({ page }) => {
  await page.goto('http://localhost:5173/login');
  await page.waitForLoadState('networkidle');
  
  // Fill login form
  await page.fill('input[id="username"]', 'testuser');
  await page.fill('input[id="password"]', 'Test123456');
  
  // Click login button
  await page.click('button[type="submit"]');
  
  // Wait for response
  await page.waitForTimeout(2000);
  
  // Check for errors
  const body = await page.locator('body').textContent();
  console.log('Page content after login:', body?.substring(0, 500));
  
  // Check URL - should redirect to home if successful
  const url = page.url();
  console.log('URL after login:', url);
});
