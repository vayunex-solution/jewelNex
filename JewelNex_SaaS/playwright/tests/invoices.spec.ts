import { test, expect } from '@playwright/test';
import { cleanupTestUser, getLatestVerificationToken, closeDb } from '../helpers/db-utils';
import path from 'path';

const TEST_EMAIL = 'playwright_invoice_test@vayunexsolution.com';
const SCREENSHOT_DIR = 'C:/Users/Administrator/.gemini/antigravity-ide/brain/78946ff0-36b9-4558-8361-62bc589089d2';

test.describe('Invoice Engine & UI Validation', () => {

  test.beforeAll(async () => {
    await cleanupTestUser(TEST_EMAIL);
  });

  test.afterAll(async () => {
    await cleanupTestUser(TEST_EMAIL);
    await closeDb();
  });

  test('Perform full validation & capture screenshots', async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    page.on('request', request => console.log('REQ >>', request.method(), request.url()));
    page.on('response', response => console.log('RES <<', response.status(), response.url()));

    // 1. Signup and Verify
    await page.goto('/signup');
    await page.fill('input[placeholder="Your full name"]', 'Invoice Test User');
    await page.fill('input[placeholder="you@example.com"]', TEST_EMAIL);
    await page.fill('input[placeholder="Create a strong password"]', 'JewelNex@2026');
    await page.fill('input[placeholder="Repeat your password"]', 'JewelNex@2026');
    await page.click('button:has-text("Create Account")');
    await expect(page.getByText('Registration Successful!')).toBeVisible();

    await page.waitForTimeout(2000);
    const otp = await getLatestVerificationToken(TEST_EMAIL);
    expect(otp).not.toBeNull();

    await page.waitForURL(/\/verify-otp\?email=.*/);
    await page.fill('input[placeholder="0 0 0 0 0 0"]', otp as string);
    await page.click('button[type="submit"]');
    await expect(page.getByText('Success!')).toBeVisible();

    // 2. Login
    await page.waitForURL(/\/login/);
    await page.fill('input[placeholder="you@example.com"]', TEST_EMAIL);
    await page.fill('input[placeholder="Enter your password"]', 'JewelNex@2026');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL(/.*dashboard/);

    // 3. Desktop Dashboard screenshot
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'desktop_dashboard.png') });
    console.log('✓ Desktop Dashboard screenshot captured');

    // 4. Inventory Page screenshot
    await page.click('a:has-text("Products")');
    await page.waitForURL(/.*inventory/);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'inventory_page.png') });
    console.log('✓ Inventory Page screenshot captured');

    // 5. Invoice Page screenshot
    await page.click('a:has-text("Invoices")');
    await page.waitForURL(/.*invoices/);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'invoice_creation_page.png') });
    console.log('✓ Invoice Creation Page screenshot captured');

    // 5b. Draft Invoices Page screenshot
    await page.click('a:has-text("Draft Invoices")');
    await page.waitForURL(/.*invoices\/drafts/);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'draft_invoices.png') });
    console.log('✓ Draft Invoices Page screenshot captured');

    // 6. Locations page check
    await page.click('a:has-text("Locations")');
    await page.waitForURL(/.*locations/);
    await expect(page.getByRole('heading', { name: 'Locations' })).toBeVisible();
    console.log('✓ Locations page verified');

    // 7. Mobile viewport simulation and screenshot
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/login');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'mobile_view.png') });
    console.log('✓ Mobile view layout screenshot captured');
  });
});
