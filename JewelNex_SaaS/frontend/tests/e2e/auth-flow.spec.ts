import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

const TEST_EMAIL = `admin_${Date.now()}@jewlnex.com`;
const TEST_PASSWORD = 'Password@123';
const TEST_NAME = 'System Admin';

test.describe('JewelNex Auth & Dashboard Flow', () => {
  test('Complete flow: Signup -> Verify -> Login -> Dashboard', async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER CONSOLE: ${msg.text()}`));
    
    // 1. Signup
    await page.goto('/signup');
    await page.fill('input[name="name"]', TEST_NAME);
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="confirmPassword"]', TEST_PASSWORD);
    
    await page.screenshot({ path: 'tests/e2e/screenshots/signup-filled.png' });
    await page.click('button[type="submit"]');

    // Wait for redirect to /verify-otp (increased timeout for SMTP/DB)
    await expect(page).toHaveURL(/\/verify-otp/, { timeout: 15000 });
    await page.screenshot({ path: 'tests/e2e/screenshots/verify-otp-page.png' });

    // 2. Get OTP from DB
    const otpOutput = execSync(`npx tsx scripts/get-otp.ts ${TEST_EMAIL}`, {
      cwd: '../backend'
    }).toString();
    const otpMatch = otpOutput.match(/OTP for .+: (\d{6})/);
    const otp = otpMatch ? otpMatch[1] : null;

    if (!otp) throw new Error(`Could not retrieve OTP. Output: ${otpOutput}`);

    // 3. Enter OTP and verify
    await page.fill('input[placeholder="0 0 0 0 0 0"]', otp);
    await page.screenshot({ path: 'tests/e2e/screenshots/otp-entered.png' });
    await page.click('button[type="submit"]');

    // Wait for redirect to login
    await expect(page).toHaveURL('/login', { timeout: 10000 });
    await page.screenshot({ path: 'tests/e2e/screenshots/post-verify-login.png' });

    // 4. Login
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // 5. Dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 15000 });
    
    // Wait for the loading state to finish by looking for the main heading
    await page.waitForSelector('main h1:has-text("Welcome")', { timeout: 20000 });
    
    // Take screenshot of finished dashboard
    await page.screenshot({ path: 'tests/e2e/screenshots/dashboard-desktop.png' });
    
    // Use more specific selector for the welcome heading
    const dashboardHeading = page.locator('main h1').first();
    await expect(dashboardHeading).toContainText(TEST_NAME.split(' ')[0], { timeout: 5000 });

    // 6. Navigate to Inventory
    await page.click('a[href="/dashboard/inventory"]');
    await expect(page).toHaveURL('/dashboard/inventory');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/e2e/screenshots/inventory-desktop.png' });

    // 7. Navigate to Locations
    await page.click('a[href="/dashboard/inventory/locations"]');
    await expect(page).toHaveURL('/dashboard/inventory/locations');
    await page.screenshot({ path: 'tests/e2e/screenshots/locations-desktop.png' });
    
    // 8. Navigate to Stock Ledger
    await page.click('a[href="/dashboard/inventory/ledger"]');
    await expect(page).toHaveURL('/dashboard/inventory/ledger');
    await page.screenshot({ path: 'tests/e2e/screenshots/ledger-desktop.png' });

    // 9. Navigate to Customers
    await page.click('a[href="/dashboard/customers"]');
    await expect(page).toHaveURL('/dashboard/customers');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'tests/e2e/screenshots/customers-empty.png' });

    // 10. Register a customer
    await page.click('button:has-text("Add Customer")');
    await page.waitForSelector('text=Register New Customer');
    await page.fill('input[placeholder="e.g. Palak Shah"]', 'Customer Palak');
    await page.fill('input[placeholder="e.g. +91 9876543210"]', `+91${Date.now().toString().slice(-10)}`);
    await page.fill('input[placeholder="e.g. client@example.com"]', `palak_${Date.now()}@example.com`);
    await page.fill('textarea[placeholder="Enter complete postal address..."]', '123 Golden Street, Zaveri Bazaar, Mumbai');
    await page.click('button[type="submit"]:has-text("Register Client")');

    // Wait for modal to close and customer list to refresh
    await expect(page.locator('text=Register New Customer')).toBeHidden();
    await page.waitForSelector('text=Customer Palak');
    await page.screenshot({ path: 'tests/e2e/screenshots/customers-list.png' });
  });

  test('Route protection: unauthenticated redirect', async ({ page }) => {
    // Dashboard should redirect to login
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/login', { timeout: 5000 });

    // Inventory should redirect to login
    await page.goto('/dashboard/inventory');
    await expect(page).toHaveURL('/login', { timeout: 5000 });
  });

  test('Auth pages: render correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('JewelNex');
    await page.screenshot({ path: 'tests/e2e/screenshots/login-page.png' });

    await page.goto('/signup');
    await expect(page.locator('h1')).toContainText('JewelNex');
    await page.screenshot({ path: 'tests/e2e/screenshots/signup-page.png' });

    await page.goto('/forgot-password');
    await expect(page.locator('h1')).toContainText('JewelNex');
    await page.screenshot({ path: 'tests/e2e/screenshots/forgot-password-page.png' });
  });
});
