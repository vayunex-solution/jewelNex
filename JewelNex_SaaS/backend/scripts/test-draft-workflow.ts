import { PrismaClient } from '@prisma/client';
import { InvoiceService } from '../src/services/invoice.service';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function runDraftWorkflowTest() {
  console.log('🔄 Setting up Draft Workflow Test Environment...');
  
  // 1. Setup Test Data
  const user = await prisma.user.findFirst({ where: { role: { name: 'admin' } } });
  if (!user) throw new Error("Admin user not found");

  const customer = await prisma.customer.create({
    data: { name: 'Test Draft Customer', phone: '8888888888' }
  });

  const product = await prisma.product.create({
    data: { sku: `TEST-DRAFT-${Date.now()}`, name: 'Draft Test Product' }
  });

  const location = await prisma.location.findFirst({ where: { type: 'WAREHOUSE' } });
  
  const lot = await prisma.inventoryLot.create({
    data: {
      productId: product.id,
      locationId: location!.id,
      quantity: 10,
      weight: 100.000,
      status: 'AVAILABLE'
    }
  });

  console.log(`✅ Test Lot created with Qty: ${lot.quantity}, Weight: ${lot.weight}g`);

  // 2. Save Draft Invoice
  console.log('\nSTEP 1: Saving a DRAFT invoice (Quantity 4)...');
  const dto = {
    type: 'SALE' as const,
    customerId: customer.id,
    subTotal: 28000, taxTotal: 840, discount: 0, grandTotal: 28840,
    items: [{
      productId: product.id,
      lotId: lot.id,
      quantity: 4,
      weight: 40.000,
      rate: 700, purity: 0.916, makingCharge: 0, wastage: 0,
      discountPercent: 0, gstPercent: 3, amount: 28840
    }],
    notes: 'Draft test memo'
  };

  const draft = await InvoiceService.saveDraft(dto, user.id);
  console.log(`✅ Draft Invoice saved with ID: ${draft.id}, Status: ${draft.status}`);

  // Verify stock was NOT affected
  let currentLot = await prisma.inventoryLot.findUnique({ where: { id: lot.id } });
  console.log(`   Verification: Lot Qty is ${currentLot?.quantity} (Expected: 10 - NO DEDUCTION)`);
  let movementsCount = await prisma.stockMovement.count({ where: { lotId: lot.id } });
  console.log(`   Verification: Stock movements count is ${movementsCount} (Expected: 0)`);

  if (currentLot?.quantity !== 10 || movementsCount !== 0) {
    throw new Error('❌ FAILED: Saving draft modified stock or created movements!');
  }

  // 3. Edit Draft Invoice
  console.log('\nSTEP 2: Editing DRAFT invoice (Change Quantity to 6)...');
  const editDto = {
    type: 'SALE' as const,
    customerId: customer.id,
    subTotal: 42000, taxTotal: 1260, discount: 0, grandTotal: 43260,
    items: [{
      productId: product.id,
      lotId: lot.id,
      quantity: 6,
      weight: 60.000,
      rate: 700, purity: 0.916, makingCharge: 0, wastage: 0,
      discountPercent: 0, gstPercent: 3, amount: 43260
    }],
    notes: 'Edited draft test memo'
  };

  const edited = await InvoiceService.editDraft(draft.id, editDto, user.id);
  console.log(`✅ Draft Invoice edited. New grand total: ₹${edited.grandTotal}, Item quantity: ${edited.items[0].quantity}`);

  // Verify stock was still NOT affected
  currentLot = await prisma.inventoryLot.findUnique({ where: { id: lot.id } });
  console.log(`   Verification: Lot Qty remains ${currentLot?.quantity} (Expected: 10 - NO DEDUCTION)`);

  if (currentLot?.quantity !== 10) {
    throw new Error('❌ FAILED: Editing draft modified stock!');
  }

  // 4. Post Draft Invoice
  console.log('\nSTEP 3: Posting DRAFT invoice atomically...');
  const payments = [{ amount: 43260, mode: 'CASH' as const }];
  const posted = await InvoiceService.postDraft(draft.id, user.id, payments);
  console.log(`✅ Draft Invoice posted. New Status: ${posted?.status}`);

  // Verify stock WAS deducted
  currentLot = await prisma.inventoryLot.findUnique({ where: { id: lot.id } });
  console.log(`   Verification: Lot Qty is now ${currentLot?.quantity} (Expected: 4 - DEDUCTED 6)`);
  movementsCount = await prisma.stockMovement.count({ where: { lotId: lot.id } });
  console.log(`   Verification: Stock movements count is ${movementsCount} (Expected: 1)`);
  
  const movement = await prisma.stockMovement.findFirst({ where: { lotId: lot.id } });
  console.log(`   Verification: Stock movement type is ${movement?.type}, QtyDelta is ${movement?.quantityDelta}`);

  if (currentLot?.quantity !== 4 || movementsCount !== 1 || movement?.quantityDelta !== -6) {
    throw new Error('❌ FAILED: Posting draft failed to deduct stock or record movement!');
  }

  // 5. Attempt Edit on Posted Invoice (Should fail)
  console.log('\nSTEP 4: Attempting to edit a POSTED invoice (Should fail)...');
  try {
    await InvoiceService.editDraft(draft.id, editDto, user.id);
    console.log('❌ FAIL: Allowed editing of a posted invoice!');
    throw new Error('Allowed editing of a posted invoice');
  } catch (e: any) {
    console.log(`✅ PASS: Correctly blocked editing posted invoice. (${e.message})`);
  }

  // 6. Reverse Posted Invoice
  console.log('\nSTEP 5: Reversing the posted invoice...');
  await InvoiceService.reverseInvoice(draft.id, user.id);
  console.log('✅ Invoice reversed successfully.');

  // Verify stock is restored
  currentLot = await prisma.inventoryLot.findUnique({ where: { id: lot.id } });
  console.log(`   Verification: Lot Qty restored to ${currentLot?.quantity} (Expected: 10)`);
  movementsCount = await prisma.stockMovement.count({ where: { lotId: lot.id } });
  console.log(`   Verification: Total movements count is now ${movementsCount} (Expected: 2 - 1 SALE, 1 REVERSAL)`);

  if (currentLot?.quantity !== 10 || movementsCount !== 2) {
    throw new Error('❌ FAILED: Reversal failed to restore stock or record compensating movement!');
  }

  console.log('\n🎉 ALL DRAFT WORKFLOW TESTS PASSED SUCCESSFULLY! 🎉\n');

  // Cleanup Test Data
  await prisma.invoicePayment.deleteMany({ where: { invoiceId: draft.id } });
  await prisma.invoiceItem.deleteMany({ where: { invoiceId: draft.id } });
  await prisma.invoice.deleteMany({ where: { id: draft.id } });
  await prisma.stockMovement.deleteMany({ where: { lotId: lot.id } });
  await prisma.inventoryLot.delete({ where: { id: lot.id } });
  await prisma.product.delete({ where: { id: product.id } });
  await prisma.customer.delete({ where: { id: customer.id } });

  await prisma.$disconnect();
}

runDraftWorkflowTest().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
