import { test, expect } from '@playwright/test';
import { cleanupTestUser, getLatestVerificationToken, closeDb } from '../helpers/db-utils';
import prisma from '../../backend/src/config/database';
import path from 'path';

const TEST_EMAIL = 'playwright_phase_f@vayunexsolution.com';
const SCREENSHOT_DIR = 'C:/Users/Administrator/.gemini/antigravity-ide/brain/78946ff0-36b9-4558-8361-62bc589089d2';

test.describe('Phase F: Production Readiness & Business Outputs UI Validation', () => {

  test.beforeAll(async () => {
    const dbUser = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
    if (dbUser) {
      await prisma.auditTrail.deleteMany({ where: { userId: dbUser.id } });
      await prisma.invoicePayment.deleteMany({ where: { invoice: { createdById: dbUser.id } } });
      await prisma.invoiceItem.deleteMany({ where: { invoice: { createdById: dbUser.id } } });
      await prisma.invoice.deleteMany({ where: { createdById: dbUser.id } });
    }
    await prisma.inventoryLot.deleteMany({ where: { location: { name: 'Main Showroom' } } });
    await prisma.product.deleteMany({ where: { sku: 'GOLD-RING-22K-001' } });
    await prisma.customer.deleteMany({ where: { name: 'Harsh Patel' } });
    await prisma.location.deleteMany({ where: { name: 'Main Showroom' } });
    await cleanupTestUser(TEST_EMAIL);
  });

  test.afterAll(async () => {
    const dbUser = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
    if (dbUser) {
      await prisma.auditTrail.deleteMany({ where: { userId: dbUser.id } });
      await prisma.invoicePayment.deleteMany({ where: { invoice: { createdById: dbUser.id } } });
      await prisma.invoiceItem.deleteMany({ where: { invoice: { createdById: dbUser.id } } });
      await prisma.invoice.deleteMany({ where: { createdById: dbUser.id } });
    }
    await prisma.inventoryLot.deleteMany({ where: { location: { name: 'Main Showroom' } } });
    await prisma.product.deleteMany({ where: { sku: 'GOLD-RING-22K-001' } });
    await prisma.customer.deleteMany({ where: { name: 'Harsh Patel' } });
    await prisma.location.deleteMany({ where: { name: 'Main Showroom' } });
    await cleanupTestUser(TEST_EMAIL);
    await closeDb();
  });

  test('Navigate through all Phase F views and capture screenshots', async ({ page }) => {
    test.setTimeout(90000);
    page.on('console', msg => {
      if (msg.type() === 'error') console.log('PAGE ERROR:', msg.text());
    });

    // 1. Signup through UI to hash password correctly
    await page.goto('/signup');
    await page.fill('input[placeholder="Your full name"]', 'Phase F Test User');
    await page.fill('input[placeholder="you@example.com"]', TEST_EMAIL);
    await page.fill('input[placeholder="Create a strong password"]', 'JewelNex@2026');
    await page.fill('input[placeholder="Repeat your password"]', 'JewelNex@2026');
    await page.click('button:has-text("Create Account")');
    await expect(page.getByText('Registration Successful!')).toBeVisible({ timeout: 10000 });

    await page.waitForTimeout(2000);
    const otp = await getLatestVerificationToken(TEST_EMAIL);
    expect(otp).not.toBeNull();

    await page.waitForURL(/\/verify-otp\?email=.*/);
    await page.fill('input[placeholder="0 0 0 0 0 0"]', otp as string);
    await page.click('button[type="submit"]');
    await expect(page.getByText('Success!')).toBeVisible({ timeout: 10000 });

    // 2. Login
    await page.waitForURL(/\/login/);
    await page.fill('input[placeholder="you@example.com"]', TEST_EMAIL);
    await page.fill('input[placeholder="Enter your password"]', 'JewelNex@2026');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL(/.*dashboard/, { timeout: 15000 });

    // Grab User ID from DB
    const dbUser = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
    if (!dbUser) throw new Error('User not found in DB after registration');

    // 3. Seed Company Settings, Customer, Product, Invoice, Payment, Audit Trail
    // Get default company settings or create it
    const companySettings = await prisma.companySettings.upsert({
      where: { id: 'default' },
      update: {
        name: 'JewelNex Premium Boutique',
        tagline: 'Crafting Elegance Since 2026',
        gstin: '24AAAAB1111A1Z1',
        panNumber: 'AAAAB1111A',
        address: '101, Gold Plaza, Jewel Road',
        city: 'Surat',
        state: 'Gujarat',
        pincode: '395003',
        phone: '+91 98765 43210',
        email: 'info@jewelnex.com',
        website: 'www.jewelnex.com',
        invoiceFooter: 'Thank you for buying from JewelNex. All disputes subject to Surat jurisdiction.',
        gstType: 'CGST_SGST',
      },
      create: {
        id: 'default',
        name: 'JewelNex Premium Boutique',
        tagline: 'Crafting Elegance Since 2026',
        gstin: '24AAAAB1111A1Z1',
        panNumber: 'AAAAB1111A',
        address: '101, Gold Plaza, Jewel Road',
        city: 'Surat',
        state: 'Gujarat',
        pincode: '395003',
        phone: '+91 98765 43210',
        email: 'info@jewelnex.com',
        website: 'www.jewelnex.com',
        invoiceFooter: 'Thank you for buying from JewelNex. All disputes subject to Surat jurisdiction.',
        gstType: 'CGST_SGST',
      }
    });

    const location = await prisma.location.create({
      data: {
        name: 'Main Showroom',
        type: 'STORE',
        isActive: true,
      }
    });

    const customer = await prisma.customer.create({
      data: {
        name: 'Harsh Patel',
        phone: '9988776655',
        email: 'harsh@gmail.com',
        gstNumber: '24BBBBB2222B2Z2',
        address: '202 Emerald Residency, Surat',
        isActive: true,
      }
    });

    const product = await prisma.product.create({
      data: {
        sku: 'GOLD-RING-22K-001',
        name: 'Kundan Gold Ring 22K',
        description: 'Fine handcrafted Kundan ring',
        grossWeight: 6.250,
        stoneWeight: 0.500,
        netWeight: 5.750,
        purity: 0.916,
        fineWeight: 5.267,
        makingCharge: 650.00,
        wastagePercent: 3.50,
      }
    });

    const lot = await prisma.inventoryLot.create({
      data: {
        productId: product.id,
        locationId: location.id,
        quantity: 5,
        weight: 31.250,
        status: 'AVAILABLE',
      }
    });

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: 'INV-2026-0001',
        type: 'SALE',
        status: 'POSTED',
        customerId: customer.id,
        subTotal: 34500.00,
        taxTotal: 1035.00,
        discount: 1500.00,
        grandTotal: 34035.00,
        createdById: dbUser.id,
        notes: 'Wedding purchase. Urgent delivery.',
      }
    });

    await prisma.invoiceItem.create({
      data: {
        invoiceId: invoice.id,
        productId: product.id,
        lotId: lot.id,
        quantity: 1,
        weight: 6.250,
        rate: 5500.00,
        purity: 0.916,
        makingCharge: 650.00,
        wastage: 3.50,
        gstPercent: 3.00,
        amount: 35035.00,
      }
    });

    await prisma.invoicePayment.create({
      data: {
        invoiceId: invoice.id,
        amount: 34035.00,
        mode: 'CASH',
        processedById: dbUser.id,
      }
    });

    // Seed some audit trails
    await prisma.auditTrail.createMany({
      data: [
        {
          entityType: 'invoice',
          entityId: invoice.id,
          action: 'POST',
          oldValues: { status: 'DRAFT' },
          newValues: { status: 'POSTED', invoiceNumber: 'INV-2026-0001' },
          userId: dbUser.id,
          ipAddress: '127.0.0.1',
          userAgent: 'Playwright E2E Agent',
        },
        {
          entityType: 'CompanySettings',
          entityId: companySettings.id,
          action: 'UPDATED',
          oldValues: { name: 'My Jewellery Shop' },
          newValues: { name: 'JewelNex Premium Boutique' },
          userId: dbUser.id,
          ipAddress: '127.0.0.1',
          userAgent: 'Playwright E2E Agent',
        }
      ]
    });

    // 4. Capture Dashboard Screenshot
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'desktop_dashboard.png') });
    console.log('✓ Desktop Dashboard screenshot captured');

    // 5. Capture Inventory Page Screenshot
    await page.goto('/dashboard/inventory');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'inventory_page.png') });
    console.log('✓ Inventory Page screenshot captured');

    // 6. Capture Invoice Creation Page Screenshot
    await page.goto('/dashboard/invoices');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'invoice_creation_page.png') });
    console.log('✓ Invoice Creation Page screenshot captured');

    // 7. Capture Draft Invoices Page Screenshot
    await page.goto('/dashboard/invoices/drafts');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'draft_invoices.png') });
    console.log('✓ Draft Invoices Page screenshot captured');

    // 8. Capture Posted Invoices Page Screenshot (Phase F)
    await page.goto('/dashboard/invoices/list');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'posted_invoices_page.png') });
    console.log('✓ Posted Invoices Page screenshot captured');

    // 9. Capture Company Settings Page Screenshot (Phase F)
    await page.goto('/dashboard/settings');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'company_settings_page.png') });
    console.log('✓ Company Settings Page screenshot captured');

    // 10. Capture Audit Log Page Screenshot (Phase F)
    await page.goto('/dashboard/audit-log');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'audit_log_page.png') });
    console.log('✓ Audit Log Page screenshot captured');

    // 11. Capture Thermal Receipt Preview Screenshot (Phase F)
    // Note: since print dialog opens automatically, we just block window.print in this test or let it open
    await page.addInitScript(() => {
      window.print = () => { console.log('window.print() called and bypassed in test'); };
    });
    await page.goto(`/dashboard/invoices/${invoice.id}/thermal`);
    await page.waitForTimeout(1500); // Wait for data load
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'thermal_receipt_preview.png') });
    console.log('✓ Thermal Receipt Preview screenshot captured');

    // 12. Capture Mobile View Layout Screenshot (Phase F)
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/login');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'mobile_view.png') });
    console.log('✓ Mobile view layout screenshot captured');
  });
});
