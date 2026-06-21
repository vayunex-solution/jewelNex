import { test, expect } from '@playwright/test';
import { getLatestVerificationToken, cleanupTestUser, closeDb } from '../helpers/db-utils';

const TEST_EMAIL = 'playwright_test@vayunexsolution.com';

test.describe('Authentication Flows', () => {
  
  test.beforeAll(async () => {
    await cleanupTestUser(TEST_EMAIL);
  });

  test.afterAll(async () => {
    await cleanupTestUser(TEST_EMAIL);
    await closeDb();
  });

  test('Signup Flow with Automated Verification', async ({ page }) => {
    // 1. Navigate to Signup
    await page.goto('/signup');
    await expect(page).toHaveTitle(/JewelNex/);

    // 2. Fill Signup Form
    await page.fill('input[placeholder="Your full name"]', 'Playwright Test User');
    await page.fill('input[placeholder="you@example.com"]', TEST_EMAIL);
    await page.fill('input[placeholder="Create a strong password"]', 'JewelNex@2026');
    await page.fill('input[placeholder="Repeat your password"]', 'JewelNex@2026');
    await page.click('button:has-text("Create Account")');

    // 3. Verify Success Message/Redirect
    await expect(page.getByText('Registration Successful!')).toBeVisible({ timeout: 15000 });

    // 4. Fetch OTP from DB Automatically
    // We wait a bit for the DB to be updated
    await page.waitForTimeout(3000);
    const otp = await getLatestVerificationToken(TEST_EMAIL);
    expect(otp).not.toBeNull();
    expect(otp?.length).toBe(6);

    // Wait for redirect to VerifyEmailPage
    await page.waitForURL(/\/verify-otp\?email=.*/, { timeout: 15000 });

    // Fill the OTP
    await page.fill('input[placeholder="0 0 0 0 0 0"]', otp as string);
    await page.click('button[type="submit"]');

    // The page should show success and say redirecting
    await expect(page.getByText('Success!')).toBeVisible({ timeout: 15000 });

    // 6. Test Login with newly verified user
    // Wait for redirect to login
    await page.waitForURL(/\/login/, { timeout: 15000 });
    await page.fill('input[placeholder="you@example.com"]', TEST_EMAIL);
    await page.fill('input[placeholder="Enter your password"]', 'JewelNex@2026');
    await page.click('button:has-text("Sign In")');

    // 7. Verify Dashboard Access
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });
    await expect(page.getByText('Welcome back')).toBeVisible({ timeout: 15000 });
  });

  test('Invalid Login Flow', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder="you@example.com"]', TEST_EMAIL);
    await page.fill('input[placeholder="Enter your password"]', 'WrongPassword123');
    await page.click('button:has-text("Sign In")');

    // Verify Error Toast/Message
    await expect(page.getByText('Invalid email or password')).toBeVisible();
  });

  test('Protected Route Redirect', async ({ page }) => {
    // Try to access dashboard without login
    await page.goto('/dashboard');
    
    // Should be redirected to login
    await expect(page).toHaveURL(/.*login/);
  });
});
