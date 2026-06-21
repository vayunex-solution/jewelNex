/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import { AccountingService } from '../src/services/accounting.service';
import { CustomerService } from '../src/services/customer.service';
import { InvoiceService } from '../src/services/invoice.service';

const prisma = new PrismaClient();

async function runReportingTest() {
  console.log('🔄 Setting up Reporting Engine Verification...');

  // 0. Pre-run cleanup of test data from previous runs
  console.log('🧹 Cleaning up leftover test data...');
  const leftoverCusts = await prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: 'Customer A (Debtor)' } },
        { name: { contains: 'Customer B (Creditor/Supplier)' } },
        { name: { contains: 'Test Customer' } }
      ]
    }
  });
  const leftoverCustIds = leftoverCusts.map(c => c.id);
  if (leftoverCustIds.length > 0) {
    const leftoverInvs = await prisma.invoice.findMany({
      where: { customerId: { in: leftoverCustIds } }
    });
    const leftoverInvIds = leftoverInvs.map(i => i.id);
    if (leftoverInvIds.length > 0) {
      await prisma.voucherEntry.deleteMany({ where: { voucher: { reference: { in: leftoverInvIds } } } });
      await prisma.voucher.deleteMany({ where: { reference: { in: leftoverInvIds } } });
      await prisma.invoicePayment.deleteMany({ where: { invoiceId: { in: leftoverInvIds } } });
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: { in: leftoverInvIds } } });
      await prisma.invoice.deleteMany({ where: { id: { in: leftoverInvIds } } });
    }
    await prisma.accountHead.deleteMany({ where: { customerId: { in: leftoverCustIds } } });
    await prisma.customer.deleteMany({ where: { id: { in: leftoverCustIds } } });
  }

  const leftoverProds = await prisma.product.findMany({
    where: {
      OR: [
        { sku: { contains: 'REP-TEST-' } },
        { sku: { contains: 'ACC-TEST-' } }
      ]
    }
  });
  const leftoverProdIds = leftoverProds.map(p => p.id);
  if (leftoverProdIds.length > 0) {
    await prisma.stockMovement.deleteMany({ where: { productId: { in: leftoverProdIds } } });
    await prisma.inventoryLot.deleteMany({ where: { productId: { in: leftoverProdIds } } });
    await prisma.product.deleteMany({ where: { id: { in: leftoverProdIds } } });
  }
  console.log('🧹 Cleanup complete.');

  // 1. Initialize COA
  await AccountingService.initializeChartOfAccounts();
  console.log('✅ COA Initialized.');

  const admin = await prisma.user.findFirst({ where: { role: { name: 'admin' } } });
  if (!admin) throw new Error("Admin user not found");
  if (!admin.companyId) throw new Error("Admin company ID not found");

  const location = await prisma.location.findFirst({ where: { type: 'WAREHOUSE' } });

  // 2. Register Customers
  const customerA = await CustomerService.createCustomer({
    name: 'Customer A (Debtor)',
    phone: `91${Math.random().toString().slice(2, 10)}`,
  }, admin.companyId);

  const customerB = await CustomerService.createCustomer({
    name: 'Customer B (Creditor/Supplier)',
    phone: `92${Math.random().toString().slice(2, 10)}`,
  }, admin.companyId);

  console.log(`✅ Customers/Suppliers registered.`);

  // 3. Setup Inventory & WAC Cost seeding
  const product = await prisma.product.create({
    data: { sku: `REP-TEST-${Date.now()}`, name: 'Valuation Test Pendant' }
  });

  const lot = await prisma.inventoryLot.create({
    data: {
      productId: product.id,
      locationId: location!.id,
      quantity: 0,
      weight: 0.000,
      status: 'AVAILABLE'
    }
  });

  console.log('🔄 Seeding Product WAC (Posting a PURCHASE invoice of 10 items at rate 4000)...');
  const purchaseDto = {
    type: 'PURCHASE' as const,
    customerId: customerB.id,
    subTotal: 40000,
    taxTotal: 1200,
    discount: 500,
    grandTotal: 40700, // 40000 + 1200 - 500 = 40700
    items: [{
      productId: product.id,
      lotId: lot.id,
      quantity: 10,
      weight: 30.000,
      rate: 4000,
      purity: 0.916,
      makingCharge: 0,
      wastage: 0,
      discountPercent: 0,
      gstPercent: 3,
      amount: 40700
    }],
    payments: [{ amount: 40700, mode: 'BANK_TRANSFER' as const }] // Paid via Bank
  };

  const purchaseInvoice = await InvoiceService.postInvoice(purchaseDto, admin.id, admin.companyId);
  console.log(`✅ Purchase Invoice posted: ${purchaseInvoice?.invoiceNumber}`);

  // WAC should be exactly 4000
  const wacCost = await AccountingService.getProductWeightedAverageCost(product.id);
  console.log(`   Seeded Product WAC: ₹${wacCost} (Expected: 4000)`);
  if (wacCost !== 4000) throw new Error('WAC calculation mismatch.');

  // 4. Post a SALE Invoice of 2 items at rate 6000 (Revenue: 12,000, COGS: 8,000, Profit: 4,000)
  console.log('\n🔄 Posting a SALE invoice of 2 items with Cash payment...');
  const saleDto = {
    type: 'SALE' as const,
    customerId: customerA.id,
    subTotal: 12000,
    taxTotal: 360,
    discount: 100,
    grandTotal: 12260, // 12000 + 360 - 100 = 12260
    items: [{
      productId: product.id,
      lotId: lot.id,
      quantity: 2,
      weight: 6.000,
      rate: 6000,
      purity: 0.916,
      makingCharge: 0,
      wastage: 0,
      discountPercent: 0,
      gstPercent: 3,
      amount: 12260
    }],
    payments: [{ amount: 7260, mode: 'CASH' as const }] // Received 7260 Cash, remaining 5000 as Receivable
  };

  const saleInvoice = await InvoiceService.postInvoice(saleDto, admin.id, admin.companyId);
  console.log(`✅ Sale Invoice posted: ${saleInvoice?.invoiceNumber}`);

  // 5. Generate Reports and Verify
  console.log('\n📖 Generating Day Book...');
  const dayBook = await AccountingService.getDayBook();
  console.log(`✅ Day Book: Found ${dayBook.length} total vouchers in DB.`);

  console.log('\n📖 Generating Customer A Ledger (Sundry Debtor)...');
  const custAHead = await prisma.accountHead.findUnique({ where: { customerId: customerA.id } });
  const ledgerA = await AccountingService.getGeneralLedger(custAHead!.id);
  console.log(`   Opening Balance: ₹${ledgerA.openingBalance}`);
  console.log(`   Closing Balance: ₹${ledgerA.closingBalance} (Expected: 5000 DR)`);
  if (ledgerA.closingBalance !== 5000) throw new Error('Customer ledger balance is incorrect.');

  console.log('\n📖 Generating Cash Book...');
  const cashHead = await prisma.accountHead.findFirst({ where: { name: 'Cash Account' } });
  const cashBook = await AccountingService.getGeneralLedger(cashHead!.id);
  console.log(`   Cash Balance: ₹${cashBook.closingBalance} (Expected: 7260 DR)`);
  if (cashBook.closingBalance !== 7260) throw new Error('Cash Book balance is incorrect.');

  console.log('\n📖 Generating Bank Book...');
  const bankHead = await prisma.accountHead.findFirst({ where: { name: 'HDFC Bank' } });
  const bankBook = await AccountingService.getGeneralLedger(bankHead!.id);
  console.log(`   Bank Balance: ₹${bankBook.closingBalance} (Expected: -40700 CR or DR offset)`);
  if (bankBook.closingBalance !== -40700) throw new Error('Bank Book balance is incorrect.');

  console.log('\n📖 Generating Trial Balance...');
  const tb = await AccountingService.getTrialBalance();
  console.log(`   Total Debits:  ₹${tb.totalDebit}`);
  console.log(`   Total Credits: ₹${tb.totalCredit}`);
  console.log(`   Balanced:      ${tb.balanced}`);
  if (!tb.balanced) throw new Error('Trial Balance is out of balance.');

  console.log('\n📖 Generating Profit & Loss Statement...');
  const pl = await AccountingService.getProfitLoss();
  console.log(`   Sales Revenue:     ₹${pl.salesRevenue} (Expected: 12000)`);
  console.log(`   Discount Allowed:  ₹${pl.discountAllowed} (Expected: 100)`);
  console.log(`   Discount Received: ₹${pl.discountReceived} (Expected: 500)`);
  console.log(`   COGS:              ₹${pl.cogs} (Expected: 8000)`);
  console.log(`   Gross Profit:      ₹${pl.grossProfit} (Expected: 4000)`);
  console.log(`   Net Profit:        ₹${pl.netProfit} (Expected: 4400)`);
  // Profit = Gross Profit (4000) - Disc Allowed (100) + Disc Received (500) = 4400
  if (pl.netProfit !== 4400) throw new Error('Profit & Loss calculation error.');

  console.log('\n📖 Generating Balance Sheet...');
  const bs = await AccountingService.getBalanceSheet();
  console.log(`   Total Assets:                  ₹${bs.assets.total}`);
  console.log(`   Total Liabilities + Equity:    ₹${bs.totalEquityAndLiabilities}`);
  console.log(`   Retained Earnings from P&L:    ₹${bs.equity.retainedEarnings}`);
  console.log(`   Balanced (Assets = L + E):     ${bs.balanced}`);
  
  // Verification details:
  // Remaining Stock Qty = 8 items. WAC = 4000. Stock Value = 32000.
  // Cash = 7260. Customer A = 5000.
  // Bank = -40700 (temporary overdraft because we paid out 40700 from 0 bank opening balance)
  // Assets = Cash (7260) + Customer (5000) + Stock (32000) + Bank (-40700) = 3560.
  // Liabilities = GST (360 Sale GST - 1200 Purchase GST Input offset = -840).
  // Equity = Capital (0) + Retained Earnings (4400).
  // Liabilities + Equity = -840 + 4400 = 3560.
  // Assets (3560) = Liabilities + Equity (3560).
  // Equation balances perfectly!
  if (!bs.balanced) throw new Error('Balance Sheet equation is out of balance.');

  console.log('\n🎉 ALL DOUBLE-ENTRY ACCOUNTING REPORTING TESTS PASSED SUCCESSFULLY! 🎉\n');

  // Clean up
  const invoiceIds = [saleInvoice!.id, purchaseInvoice!.id];
  await prisma.voucherEntry.deleteMany({ where: { voucher: { reference: { in: invoiceIds } } } });
  await prisma.voucher.deleteMany({ where: { reference: { in: invoiceIds } } });
  await prisma.invoicePayment.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
  await prisma.invoiceItem.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
  await prisma.invoice.deleteMany({ where: { id: { in: invoiceIds } } });
  await prisma.stockMovement.deleteMany({ where: { lotId: lot.id } });
  await prisma.inventoryLot.delete({ where: { id: lot.id } });
  await prisma.product.delete({ where: { id: product.id } });
  await prisma.accountHead.deleteMany({ where: { customerId: { in: [customerA.id, customerB.id] } } });
  await prisma.customer.deleteMany({ where: { id: { in: [customerA.id, customerB.id] } } });

  await prisma.$disconnect();
}

runReportingTest().catch(async (e) => {
  console.error('❌ Test execution failed:', e);
  await prisma.$disconnect();
  process.exit(1);
});
