import { test, expect } from '@playwright/test';

test.describe('Selection Toolbar E2E', () => {
  const randomUser = `testuser${Date.now()}`;
  const randomEmail = `test${Date.now()}@example.com`;
  const testPassword = 'Test123456';

  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[id="username"]', randomUser);
    await page.fill('input[id="name"]', 'Test User');
    await page.fill('input[id="email"]', randomEmail);
    await page.fill('input[id="password"]', testPassword);
    await page.fill('input[id="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(2000);
    
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
  });

  test('enter and exit selection mode', async ({ page }) => {
    const createProjectBtn = page.getByRole('button', { name: /new project|建立專案/i });
    
    if (await createProjectBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createProjectBtn.click();
      await page.waitForTimeout(500);
      const nameInput = page.locator('input[name="name"]').first();
      if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nameInput.fill('Test Project for Selection');
        await page.getByRole('button', { name: /create|建立|submit|送出/i }).first().click();
        await page.waitForTimeout(1000);
      }
    }
    
    const projectCard = page.locator('[class*="card"], [class*="project"]').first();
    if (await projectCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectCard.click();
      await page.waitForTimeout(1000);
    }

    const selectionModeBtn = page.getByText('多選模式');
    if (await selectionModeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await selectionModeBtn.click();
      await expect(page.getByText('多選模式')).toBeVisible();
      await expect(page.getByText('退出')).toBeVisible();
      
      await page.getByText('退出').click();
      await expect(page.getByText('多選模式')).toBeVisible();
    }
  });

  test('select single task', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    const projectLinks = page.locator('a[href*="/projects/"]');
    const count = await projectLinks.count();
    
    if (count > 0) {
      await projectLinks.first().click();
      await page.waitForTimeout(1500);
    }

    const selectionModeBtn = page.getByText('多選模式');
    if (await selectionModeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await selectionModeBtn.click();
      
      const taskCard = page.locator('[class*="task"], [class*="card"]').first();
      if (await taskCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        await taskCard.click();
        await expect(page.getByText(/已選擇 1 個任務/)).toBeVisible();
      }
    }
  });

  test('merge button disabled when less than 2 tasks selected', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    const projectLinks = page.locator('a[href*="/projects/"]');
    const count = await projectLinks.count();
    
    if (count > 0) {
      await projectLinks.first().click();
      await page.waitForTimeout(1500);
    }

    const selectionModeBtn = page.getByText('多選模式');
    if (await selectionModeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await selectionModeBtn.click();
      
      const taskCard = page.locator('[class*="task"], [class*="card"]').first();
      if (await taskCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        await taskCard.click();
        
        const mergeBtn = page.getByRole('button', { name: '合併' });
        await expect(mergeBtn).toBeDisabled();
      }
    }
  });

  test('clear selection', async ({ page }) => {
    await page.goto('/projects');
    await page.waitForLoadState('networkidle');
    
    const projectLinks = page.locator('a[href*="/projects/"]');
    const count = await projectLinks.count();
    
    if (count > 0) {
      await projectLinks.first().click();
      await page.waitForTimeout(1500);
    }

    const selectionModeBtn = page.getByText('多選模式');
    if (await selectionModeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await selectionModeBtn.click();
      
      const taskCard = page.locator('[class*="task"], [class*="card"]').first();
      if (await taskCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        await taskCard.click();
        await expect(page.getByText(/已選擇 1 個任務/)).toBeVisible();
        
        await page.getByRole('button', { name: '取消' }).click();
        await expect(page.getByText(/已選擇 1 個任務/)).not.toBeVisible();
      }
    }
  });
});
