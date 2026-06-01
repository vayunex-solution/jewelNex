import { PrismaClient } from '@prisma/client';
import { InvoiceService } from '../src/services/invoice.service';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function runConcurrencyTest() {
  console.log('🔄 Setting up Concurrency Test Environment...');
  
  // 1. Setup Test Data
  const user = await prisma.user.findFirst({ where: { role: { name: 'admin' } } });
  if (!user) throw new Error("Admin user not found");

  const customer = await prisma.customer.create({
    data: { name: 'Test Concurrency Customer', phone: '9999999999' }
  });

  const product = await prisma.product.create({
    data: { sku: `TEST-INV-${Date.now()}`, name: 'Concurrency Test Bangle' }
  });

  const location = await prisma.location.findFirst({ where: { type: 'WAREHOUSE' } });
  
  const lot = await prisma.inventoryLot.create({
    data: {
      productId: product.id,
      locationId: location!.id,
      quantity: 5,
      weight: 50.000,
      status: 'AVAILABLE'
    }
  });

  console.log(`✅ Test Lot created with Qty: ${lot.quantity}, Weight: ${lot.weight}g`);
  console.log('🚀 Launching 10 simultaneous SALE requests (each trying to buy 1 qty)...');

  // 2. Simulate Concurrent Requests
  const numRequests = 10;
  const requests = [];

  for (let i = 0; i < numRequests; i++) {
    const requestPromise = async () => {
      try {
        const dto = {
          type: 'SALE' as const,
          customerId: customer.id,
          subTotal: 5000, taxTotal: 150, discount: 0, grandTotal: 5150,
          items: [{
            productId: product.id,
            lotId: lot.id,
            quantity: 1,
            weight: 10.000,
            rate: 500, purity: 0.916, makingCharge: 0, wastage: 0,
            discountPercent: 0, gstPercent: 3, amount: 5150
          }],
          payments: [{ amount: 5150, mode: 'CASH' as const }]
        };
        
        await InvoiceService.postInvoice(dto, user.id);
        return { success: true, id: i };
      } catch (err: any) {
        return { success: false, error: err.message, id: i };
      }
    };
    requests.push(requestPromise());
  }

  // Await all simultaneously
  const results = await Promise.all(requests);
  
  // 3. Analyze Results
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log('\n📊 Concurrency Results:');
  console.log(`   Successful Invoices: ${successful}`);
  console.log(`   Failed (Rollback due to Insufficient Stock or Lock): ${failed}`);
  
  if (failed > 0) {
    console.log(`   Sample Error: ${results.find(r => !r.success)?.error}`);
  }

  // 4. Verify Final Database State
  const finalLot = await prisma.inventoryLot.findUnique({ where: { id: lot.id } });
  console.log('\n🔍 Final Integrity Verification:');
  console.log(`   Expected Remaining Qty: 0 (Started with 5, Max 5 can succeed)`);
  console.log(`   Actual Remaining Qty: ${finalLot?.quantity}`);
  console.log(`   Actual Remaining Weight: ${finalLot?.weight}g`);
  
  if (finalLot?.quantity === 0 && successful === 5) {
    console.log('✅ PASS: Atomic SP strictly prevented overselling under concurrent load.');
  } else {
    console.log('❌ FAIL: Integrity compromised.');
  }

  // 5. Reversal Integrity Test
  console.log('\n🔄 Testing Invoice Reversal Integrity...');
  const invoices = await prisma.invoice.findMany({ where: { customerId: customer.id } });
  
  if (invoices.length > 0) {
    const invoiceToReverse = invoices[0];
    try {
      await InvoiceService.reverseInvoice(invoiceToReverse.id, user.id);
      console.log('✅ Invoice Reversed Successfully.');
      
      const revertedLot = await prisma.inventoryLot.findUnique({ where: { id: lot.id } });
      console.log(`   Restored Lot Qty: ${revertedLot?.quantity} (Should be 1)`);
      
      // Attempt duplicate reversal
      try {
        await InvoiceService.reverseInvoice(invoiceToReverse.id, user.id);
        console.log('❌ FAIL: Allowed duplicate reversal!');
      } catch (e: any) {
        console.log(`✅ PASS: Prevented duplicate reversal. (${e.message})`);
      }
      
    } catch (e: any) {
      console.log('❌ Reversal Failed:', e.message);
    }
  }

  // Cleanup Test Data
  await prisma.invoicePayment.deleteMany({ where: { invoice: { customerId: customer.id } } });
  await prisma.invoiceItem.deleteMany({ where: { invoice: { customerId: customer.id } } });
  await prisma.invoice.deleteMany({ where: { customerId: customer.id } });
  await prisma.stockMovement.deleteMany({ where: { lotId: lot.id } });
  await prisma.inventoryLot.delete({ where: { id: lot.id } });
  await prisma.product.delete({ where: { id: product.id } });
  await prisma.customer.delete({ where: { id: customer.id } });
  
  await prisma.$disconnect();
}

runConcurrencyTest();
