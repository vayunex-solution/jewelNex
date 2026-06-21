import { test, expect } from '@playwright/test';
import { cleanupTestUser, getLatestVerificationToken, closeDb } from '../helpers/db-utils';
import prisma from '../../backend/src/config/database';
import path from 'path';
import fs from 'fs';

const TEST_EMAIL = 'playwright_uat@vayunexsolution.com';
const SCREENSHOT_DIR = 'C:/Users/Administrator/.gemini/antigravity-ide/brain/78946ff0-36b9-4558-8361-62bc589089d2';
const BACKEND_URL = 'http://localhost:5000';

// Helper to log audit details
const uatLog: any[] = [];
function logUatStep(step: string, apiCall: string, dbAffected: string, expected: string, actual: string) {
  uatLog.push({ step, apiCall, dbAffected, expected, actual });
}

// Robust cleanup helper to clear database of UAT entries in correct dependency order
async function performDbCleanup() {
  // First, find UAT customer and delete all vouchers referencing their account head
  const uatCustomer = await prisma.customer.findFirst({
    where: { name: 'Amit Sharma' }
  });
  if (uatCustomer) {
    const uatCustHead = await prisma.accountHead.findFirst({
      where: { customerId: uatCustomer.id }
    });
    if (uatCustHead) {
      const uatVoucherEntries = await prisma.voucherEntry.findMany({
        where: { accountId: uatCustHead.id },
        select: { voucherId: true }
      });
      const uatVoucherIds = uatVoucherEntries.map(e => e.voucherId);
      if (uatVoucherIds.length > 0) {
        await prisma.voucherEntry.deleteMany({
          where: { voucherId: { in: uatVoucherIds } }
        });
        await prisma.voucher.deleteMany({
          where: { id: { in: uatVoucherIds } }
        });
      }
    }
  }

  const dbUser = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
  if (dbUser) {
    // 1. Find all invoices created by this user
    const invoices = await prisma.invoice.findMany({
      where: { createdById: dbUser.id },
      select: { id: true, invoiceNumber: true }
    });
    const invoiceIds = invoices.map(i => i.id);

    // 2. Delete audit trails for this user
    await prisma.auditTrail.deleteMany({ where: { userId: dbUser.id } });

    // 3. Delete accounting voucher entries and vouchers for these invoices (in case any others exist)
    if (invoiceIds.length > 0) {
      await prisma.voucherEntry.deleteMany({
        where: { voucher: { reference: { in: invoiceIds } } }
      });
      await prisma.voucher.deleteMany({
        where: { reference: { in: invoiceIds } }
      });
    }

    // 4. Delete invoice payments
    await prisma.invoicePayment.deleteMany({
      where: { invoiceId: { in: invoiceIds } }
    });

    // 5. Delete invoice items
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: { in: invoiceIds } }
    });

    // 6. Delete stock movements
    await prisma.stockMovement.deleteMany({
      where: { userId: dbUser.id }
    });

    // 7. Delete invoices
    await prisma.invoice.deleteMany({
      where: { createdById: dbUser.id }
    });
  }

  // 8. Delete inventory lots for UAT location
  await prisma.inventoryLot.deleteMany({
    where: { location: { name: 'UAT Main Showroom' } }
  });

  // 9. Delete UAT products
  await prisma.product.deleteMany({
    where: { sku: 'UAT-GOLD-NECKLACE' }
  });

  // 10. Delete account head for UAT customer
  await prisma.accountHead.deleteMany({
    where: { customer: { name: 'Amit Sharma' } }
  });

  // 11. Delete customer
  await prisma.customer.deleteMany({
    where: { name: 'Amit Sharma' }
  });

  // 12. Delete UAT location
  await prisma.location.deleteMany({
    where: { name: 'UAT Main Showroom' }
  });
}

test.describe('JewelNex SaaS — Final E2E UAT Acceptance Testing', () => {

  test.beforeAll(async () => {
    // Clean up any leftovers from previous aborted runs
    await performDbCleanup();
    await cleanupTestUser(TEST_EMAIL);
  });

  test.afterAll(async () => {
    // Final DB cleanup and close connection
    await performDbCleanup();
    await cleanupTestUser(TEST_EMAIL);
    await closeDb();
    
    // Write out the JSON log for compilation into UAT report
    fs.writeFileSync(
      path.join(SCREENSHOT_DIR, 'uat_run_log.json'),
      JSON.stringify(uatLog, null, 2)
    );
  });

  test('Execute complete E2E business scenario and capture proof package', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes timeout to navigate and verify all steps

    page.on('console', msg => {
      if (msg.type() === 'error') console.log('PAGE ERROR:', msg.text());
    });

    // --- STEP 0: LOGIN & RETRIEVE JWT ---
    await page.goto('/signup');
    await page.fill('input[placeholder="Your full name"]', 'UAT Auditor');
    await page.fill('input[placeholder="you@example.com"]', TEST_EMAIL);
    await page.fill('input[placeholder="Create a strong password"]', 'JewelNex@2026');
    await page.fill('input[placeholder="Repeat your password"]', 'JewelNex@2026');
    await page.click('button:has-text("Create Account")');
    await expect(page.getByText('Registration Successful!')).toBeVisible({ timeout: 15000 });

    await page.waitForTimeout(2000);
    const otp = await getLatestVerificationToken(TEST_EMAIL);
    expect(otp).not.toBeNull();

    await page.waitForURL(/\/verify-otp\?email=.*/);
    await page.fill('input[placeholder="0 0 0 0 0 0"]', otp as string);
    await page.click('button[type="submit"]');
    await expect(page.getByText('Success!')).toBeVisible({ timeout: 10000 });

    await page.waitForURL(/\/login/);
    await page.fill('input[placeholder="you@example.com"]', TEST_EMAIL);
    await page.fill('input[placeholder="Enter your password"]', 'JewelNex@2026');
    await page.click('button:has-text("Sign In")');
    await page.waitForURL(/.*dashboard/, { timeout: 15000 });

    // Retrieve JWT from local storage
    const authDataStr = await page.evaluate(() => localStorage.getItem('jewelnex-auth'));
    if (!authDataStr) throw new Error('Failed to find auth storage');
    const authData = JSON.parse(authDataStr);
    const token = authData.state.token;

    // Fetch user directly from DB to get the reliable companyId
    const dbUser = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
    if (!dbUser) throw new Error('User not found in DB after registration');
    if (!dbUser.companyId) throw new Error('User companyId not found in DB');

    const requestHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Make sure we have a location
    const location = await prisma.location.create({
      data: {
        name: 'UAT Main Showroom',
        type: 'STORE',
        isActive: true,
        companyId: dbUser.companyId,
      }
    });

    // Seed UAT Company Settings for invoice header branding
    await prisma.companySettings.update({
      where: { companyId: dbUser.companyId },
      data: {
        name: 'JewelNex UAT Shop',
        tagline: 'Precision Auditing v1.0',
        gstin: '24UATIN1111U1Z1',
        address: '505, Quality Assurance Road',
        city: 'Surat',
        state: 'Gujarat',
        pincode: '395007',
        phone: '+91 99999 99999',
        gstType: 'CGST_SGST',
      }
    });

    // --- STEP 1: CREATE PRODUCT ---
    const prodRes = await page.request.post(`${BACKEND_URL}/api/v1/inventory/products`, {
      headers: requestHeaders,
      data: {
        sku: 'UAT-GOLD-NECKLACE',
        name: 'UAT Luxury Gold Necklace 22K',
        description: 'Fine handcrafted UAT gold necklace',
        grossWeight: 18.500,
        stoneWeight: 1.200,
        netWeight: 17.300,
        purity: 0.916,
        fineWeight: 15.849,
        wastagePercent: 3.00,
        makingCharge: 500.00
      }
    });
    if (!prodRes.ok()) {
      console.log('PRODUCT CREATION FAILED STATUS:', prodRes.status());
      console.log('PRODUCT CREATION FAILED RESPONSE:', await prodRes.text());
    }
    expect(prodRes.ok()).toBe(true);
    const prodData = (await prodRes.json()).data;
    logUatStep(
      'Create Product',
      'POST /api/v1/inventory/products',
      'products',
      'Product model created with SKU UAT-GOLD-NECKLACE and status code 201',
      `Product created successfully (ID: ${prodData.id})`
    );

    // Capture Products page showing the new product
    await page.goto('/dashboard/inventory');
    await page.waitForTimeout(1500); // Renders product cards
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'uat_1_product.png') });

    // --- STEP 2: ADD STOCK ---
    // Explicitly create lot in database first so that processStockMovement SP has a lot to update
    const lot = await prisma.inventoryLot.create({
      data: {
        productId: prodData.id,
        locationId: location.id,
        quantity: 0,
        weight: 0.000,
        status: 'AVAILABLE'
      }
    });

    const stockRes = await page.request.post(`${BACKEND_URL}/api/v1/inventory/movements`, {
      headers: requestHeaders,
      data: {
        productId: prodData.id,
        lotId: lot.id,
        type: 'OPENING',
        toLocationId: location.id,
        quantityDelta: 5,
        weightDelta: 92.500
      }
    });
    expect(stockRes.ok()).toBe(true);
    const stockData = await stockRes.json();
    
    // Find created/updated lot
    const lotAfterUpdate = await prisma.inventoryLot.findUnique({
      where: { id: lot.id }
    });
    expect(lotAfterUpdate).not.toBeNull();
    logUatStep(
      'Add Stock',
      'POST /api/v1/inventory/movements',
      'stock_movements, inventory_lots',
      'Inventory lot created with quantity 5 and weight 92.5g',
      `Lot created (ID: ${lotAfterUpdate?.id}) with quantity ${lotAfterUpdate?.quantity}`
    );

    // Capture stock movements view (Products Ledger tab / Movements page)
    await page.goto('/dashboard/inventory/ledger');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'uat_2_stock.png') });

    // --- STEP 3: CREATE CUSTOMER ---
    const custRes = await page.request.post(`${BACKEND_URL}/api/v1/customers`, {
      headers: requestHeaders,
      data: {
        name: 'Amit Sharma',
        phone: '9898989898',
        email: 'amit@example.com',
        address: '404 Diamond Towers, Surat, Gujarat'
      }
    });
    expect(custRes.ok()).toBe(true);
    const custData = (await custRes.json()).data;
    logUatStep(
      'Create Customer',
      'POST /api/v1/customers',
      'customers',
      'Customer Amit Sharma created successfully and searchable',
      `Customer created (ID: ${custData.id})`
    );

    // Capture customer in the autocomplete search list on the invoice page
    await page.goto('/dashboard/invoices');
    await page.fill('input[placeholder="Search customer by name or phone (e.g. Test)..."]', '9898989898');
    await page.waitForTimeout(1500); // Search resolves
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'uat_3_customer.png') });

    // --- STEP 4: GENERATE INVOICE & RECEIVE PAYMENT ---
    // Calculate total sold: 2 items, gross weight 37.0g
    // Metal base amount: 37.0g * 6000 = 222000
    // Making charges: 37.0g * 500 = 18500
    // Wastage: 3% of 37g fine = 1.11g -> 1.11 * 6000 = 6660
    // Total taxable: 222000 + 18500 + 6660 = 247160
    // Discount: 5000 -> Taxable subtotal: 242160
    // Tax (3% GST): 7264.80
    // Grand Total: 249424.80
    const invoiceRes = await page.request.post(`${BACKEND_URL}/api/v1/invoices`, {
      headers: requestHeaders,
      data: {
        type: 'SALE',
        customerId: custData.id,
        subTotal: 247160.00,
        taxTotal: 7264.80,
        discount: 5000.00,
        grandTotal: 249424.80,
        notes: 'UAT Acceptance testing Sale',
        items: [
          {
            productId: prodData.id,
            lotId: lot?.id,
            quantity: 2,
            weight: 37.000,
            rate: 6000.00,
            purity: 0.916,
            makingCharge: 500.00,
            wastage: 3.00,
            discountPercent: 0.00,
            gstPercent: 3.00,
            amount: 247160.00
          }
        ],
        payments: [
          {
            amount: 249424.80,
            mode: 'BANK_TRANSFER',
            referenceId: 'UAT-TXN-HDFC-999'
          }
        ]
      }
    });
    expect(invoiceRes.ok()).toBe(true);
    const invoiceData = (await invoiceRes.json()).data;
    
    // Verify lot is reduced to 3 in DB
    const lotAfter = await prisma.inventoryLot.findUnique({ where: { id: lot?.id || '' } });
    expect(lotAfter?.quantity).toBe(3);

    logUatStep(
      'Generate Invoice & Receive Payment',
      'POST /api/v1/invoices',
      'invoices, invoice_items, invoice_payments, inventory_lots, stock_movements',
      'Invoice created, stock reduced by 2 (lot quantity becomes 3), payment of 249,424.80 recorded',
      `Invoice posted successfully (ID: ${invoiceData.id}). Lot quantity: ${lotAfter?.quantity}. Payment recorded.`
    );

    // Go to Posted Invoices page to capture screenshot
    await page.goto('/dashboard/invoices/list');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'uat_4_invoice_create.png') });

    // --- STEP 5: VERIFY VOUCHER CREATION & TRIAL BALANCE ---
    // Navigate to Accounting -> Day Book
    await page.goto('/dashboard/accounting');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'uat_5_vouchers.png') });

    // Verify voucher balances in DB
    const voucher = await prisma.voucher.findFirst({
      where: { reference: invoiceData.id },
      include: { entries: true }
    });
    expect(voucher).not.toBeNull();
    const sumDr = voucher?.entries.filter(e => e.type === 'DR').reduce((s, e) => s + Number(e.amount), 0) || 0;
    const sumCr = voucher?.entries.filter(e => e.type === 'CR').reduce((s, e) => s + Number(e.amount), 0) || 0;
    expect(Math.abs(sumDr - sumCr)).toBeLessThan(0.01);
    
    logUatStep(
      'Verify Voucher Creation & Double-Entry Balance',
      'GET /api/v1/accounting/reports/daybook',
      'vouchers, voucher_entries',
      'Dynamic Voucher generated with Balanced Debits and Credits',
      `Voucher ${voucher?.voucherNumber} balances: DR ₹${sumDr} = CR ₹${sumCr}`
    );

    // --- STEP 6: REVERSE INVOICE ---
    const reverseRes = await page.request.post(`${BACKEND_URL}/api/v1/invoices/${invoiceData.id}/reverse`, {
      headers: requestHeaders
    });
    expect(reverseRes.ok()).toBe(true);

    // Verify lot is restored to 5 in DB
    const lotAfterReversal = await prisma.inventoryLot.findUnique({ where: { id: lot?.id || '' } });
    expect(lotAfterReversal?.quantity).toBe(5);

    logUatStep(
      'Reverse Invoice',
      'POST /api/v1/invoices/:id/reverse',
      'invoices, inventory_lots, stock_movements, vouchers, voucher_entries',
      'Invoice status becomes REVERSED; stock lot quantity restored to 5; compensating vouchers created',
      `Reversal API succeeded. Restored lot quantity: ${lotAfterReversal?.quantity}.`
    );

    // Capture Day Book showing the reversal compensating voucher
    await page.goto('/dashboard/accounting');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'uat_6_reversal.png') });

    // --- STEP 7: VERIFY REPORTS ---
    // Navigate to Trial Balance tab on Accounting Module to verify Dr = Cr proof
    const trialBalanceTab = page.locator('button:has-text("Trial Balance"), [role="tab"]:has-text("Trial Balance")').first();
    await trialBalanceTab.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'uat_7_financials.png') });

    // Verify DB states for final vouchers
    const finalVouchers = await prisma.voucher.findMany({
      include: { entries: true }
    });
    let netDebit = 0;
    let netCredit = 0;
    for (const v of finalVouchers) {
      for (const e of v.entries) {
        if (e.type === 'DR') netDebit += Number(e.amount);
        else netCredit += Number(e.amount);
      }
    }
    expect(Math.abs(netDebit - netCredit)).toBeLessThan(0.01);

    logUatStep(
      'Verify Trial Balance & Ledger Restoration',
      'GET /api/v1/accounting/reports/trial-balance',
      'vouchers, voucher_entries',
      'Ledger remains balanced with netDebit equal to netCredit after reversal',
      `Ledger Verified Balanced: Total Debit ₹${netDebit.toFixed(2)} = Total Credit ₹${netCredit.toFixed(2)}`
    );
  });
});
