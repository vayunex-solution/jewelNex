import { PrismaClient } from '@prisma/client';
import { AccountingService } from '../src/services/accounting.service';
import { CustomerService } from '../src/services/customer.service';
import { InvoiceService } from '../src/services/invoice.service';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function runAccountingTest() {
  console.log('🔄 Setting up Accounting Engine Validation...');

  // 1. Initialize COA
  await AccountingService.initializeChartOfAccounts();
  console.log('✅ Chart of Accounts initialized.');

  // 2. Register Customer (triggers account head hook)
  const customerName = `Test Customer ${Date.now()}`;
  const customer = await CustomerService.createCustomer({
    name: customerName,
    phone: `9${Math.random().toString().slice(2, 11)}`,
    email: `accounting_${Date.now()}@vayunex.com`,
  });

  console.log(`✅ Customer created: ${customer.name} (ID: ${customer.id})`);

  // Verify AccountHead was automatically created
  const head = await prisma.accountHead.findUnique({
    where: { customerId: customer.id }
  });

  if (!head) {
    throw new Error('❌ FAIL: AccountHead was not created automatically for the customer.');
  }
  console.log(`✅ Customer AccountHead verified: "${head.name}" (ID: ${head.id})`);

  // 3. Setup Inventory for Posting
  const product = await prisma.product.create({
    data: { sku: `ACC-TEST-${Date.now()}`, name: 'Accounting Test Ring' }
  });

  const location = await prisma.location.findFirst({ where: { type: 'WAREHOUSE' } });
  
  const lot = await prisma.inventoryLot.create({
    data: {
      productId: product.id,
      locationId: location!.id,
      quantity: 5,
      weight: 15.000,
      status: 'AVAILABLE'
    }
  });

  // 4. Post an Invoice (Grand Total: 10,300. GST: 300. Discount: 200. Subtotal: 10,200. Payment: 5,000 Cash)
  console.log('\n🔄 Posting a SALE invoice with payments...');
  const dto = {
    type: 'SALE' as const,
    customerId: customer.id,
    subTotal: 10200,
    taxTotal: 300,
    discount: 200,
    grandTotal: 10300, // grandTotal = subTotal + taxTotal - discount = 10200 + 300 - 200 = 10300
    items: [{
      productId: product.id,
      lotId: lot.id,
      quantity: 1,
      weight: 3.000,
      rate: 3400,
      purity: 0.916,
      makingCharge: 0,
      wastage: 0,
      discountPercent: 0,
      gstPercent: 3,
      amount: 10300
    }],
    payments: [{ amount: 5000, mode: 'CASH' as const }]
  };

  const admin = await prisma.user.findFirst({ where: { role: { name: 'admin' } } });
  if (!admin) throw new Error("Admin user not found");

  const invoice = await InvoiceService.postInvoice(dto, admin.id);
  console.log(`✅ Invoice posted successfully. Invoice Number: ${invoice?.invoiceNumber}`);

  // 5. Verify Vouchers generated
  const vouchers = await prisma.voucher.findMany({
    where: { reference: invoice?.id },
    include: { entries: true }
  });

  console.log(`📊 Accounting Vouchers generated: ${vouchers.length}`);
  if (vouchers.length !== 2) {
    throw new Error(`❌ FAIL: Expected 2 vouchers (1 SALES, 1 RECEIPT), found ${vouchers.length}`);
  }

  // Verify Vouchers DR/CR Balance
  for (const voucher of vouchers) {
    console.log(`   - Voucher: ${voucher.voucherNumber} (Type: ${voucher.type}, Entries: ${voucher.entries.length})`);
    let drSum = 0;
    let crSum = 0;
    for (const entry of voucher.entries) {
      if (entry.type === 'DR') drSum += Number(entry.amount);
      else crSum += Number(entry.amount);
    }
    console.log(`     Debits: ₹${drSum}, Credits: ₹${crSum}`);
    if (Math.abs(drSum - crSum) > 0.01) {
      throw new Error(`❌ FAIL: Voucher ${voucher.voucherNumber} does not balance!`);
    }
  }
  console.log('✅ PASS: Double-entry voucher balance checks passed.');

  // 6. Dynamic Customer balance check
  const customerBalance = await AccountingService.getCustomerBalance(customer.id);
  console.log(`\n🔍 Customer Account Head balance: ₹${customerBalance}`);
  // Invoice grandTotal (Debit receivable) = 10,300
  // Payment cash (Credit receipt) = 5,000
  // Net balance = 10,300 - 5,000 = 5,300 (DR receivable balance)
  if (customerBalance !== 5300) {
    throw new Error(`❌ FAIL: Expected customer balance to be ₹5300, got ₹${customerBalance}`);
  }
  console.log('✅ PASS: Customer dynamically aggregated ledger balance is correct.');

  // 7. Verify dynamic cash account balance
  const cashHead = await prisma.accountHead.findFirst({ where: { name: 'Cash Account' } });
  const cashBalance = await AccountingService.getAccountBalance(cashHead!.id);
  console.log(`🔍 Cash Account ledger balance: ₹${cashBalance} (Expected: ₹5000 increase)`);
  if (cashBalance < 5000) {
    throw new Error(`❌ FAIL: Expected Cash Account balance to reflect payment amount.`);
  }

  // 8. Reversal Integrity
  console.log('\n🔄 Reversing the Posted Invoice...');
  await InvoiceService.reverseInvoice(invoice!.id, admin.id);
  console.log('✅ Invoice reversed.');

  // Verify dynamic balances after reversal
  const customerBalanceAfterReversal = await AccountingService.getCustomerBalance(customer.id);
  console.log(`🔍 Customer Account Head balance after reversal: ₹${customerBalanceAfterReversal}`);
  if (customerBalanceAfterReversal !== 0) {
    throw new Error(`❌ FAIL: Expected customer balance to be 0 after reversal, got ₹${customerBalanceAfterReversal}`);
  }
  console.log('✅ PASS: Reversal dynamic balance check passed.');

  // 9. Trial Balance validation (Sum of all DR accounts = Sum of all CR accounts)
  console.log('\n📊 Running Trial Balance validation across all account heads...');
  const heads = await prisma.accountHead.findMany();
  let drTotal = 0;
  let crTotal = 0;
  
  for (const h of heads) {
    const bal = await AccountingService.getAccountBalance(h.id);
    if (bal > 0) {
      if (h.balanceType === 'DR') drTotal += bal;
      else crTotal += bal;
    } else if (bal < 0) {
      // Negative balance on DR account acts as CR, negative balance on CR account acts as DR
      if (h.balanceType === 'DR') crTotal += Math.abs(bal);
      else drTotal += Math.abs(bal);
    }
  }

  console.log(`   Trial Balance Dr Total: ₹${drTotal}`);
  console.log(`   Trial Balance Cr Total: ₹${crTotal}`);
  if (Math.abs(drTotal - crTotal) > 0.01) {
    throw new Error('❌ FAIL: Trial Balance is out of balance!');
  }
  console.log('✅ PASS: Trial Balance net-zero check passed.');

  console.log('\n🎉 ALL PHASE E DOUBLE-ENTRY ACCOUNTING ENGINE TESTS PASSED SUCCESSFULLY! 🎉\n');

  // Cleanup Test Data
  await prisma.voucherEntry.deleteMany({ where: { voucher: { reference: invoice?.id } } });
  await prisma.voucher.deleteMany({ where: { reference: invoice?.id } });
  await prisma.invoicePayment.deleteMany({ where: { invoiceId: invoice!.id } });
  await prisma.invoiceItem.deleteMany({ where: { invoiceId: invoice!.id } });
  await prisma.invoice.deleteMany({ where: { id: invoice!.id } });
  await prisma.stockMovement.deleteMany({ where: { lotId: lot.id } });
  await prisma.inventoryLot.delete({ where: { id: lot.id } });
  await prisma.product.delete({ where: { id: product.id } });
  await prisma.accountHead.delete({ where: { id: head.id } });
  await prisma.customer.delete({ where: { id: customer.id } });

  await prisma.$disconnect();
}

runAccountingTest().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
