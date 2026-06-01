import { test, expect } from '@playwright/test';

test.describe('Responsive UI Layout', () => {
  
  const pages = ['/login', '/signup', '/forgot-password'];

  for (const path of pages) {
    test(`Layout check on ${path}`, async ({ page, isMobile }) => {
      await page.goto(path);
      
      // 1. Check for basic visibility
      await expect(page.locator('form')).toBeVisible();

      // 2. Check for overflow
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(overflow).toBe(false);

      // 3. Mobile specific checks
      if (isMobile) {
        // Example: Sidebar should be hidden or burger menu visible
        // await expect(page.locator('#mobile-menu')).toBeVisible();
      }
    });
  }
});
