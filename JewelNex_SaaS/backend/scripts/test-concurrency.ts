import { InventoryService } from '../src/services/inventory.service';
import prisma from '../src/config/database';
import { v4 as uuidv4 } from 'uuid';

async function runConcurrencyTest() {
  console.log('--- STARTING CONCURRENCY & RACE CONDITION TEST ---');

  // 1. Setup Data
  const user = await prisma.user.findFirst();
  if (!user) throw new Error('No user found');

  const location = await prisma.location.create({
    data: { name: 'Test Warehouse ' + Date.now() }
  });

  const product = await prisma.product.create({
    data: {
      sku: 'TEST-RACE-' + Date.now(),
      name: 'Concurrency Test Ring',
    }
  });

  const lot = await prisma.inventoryLot.create({
    data: {
      productId: product.id,
      locationId: location.id,
      quantity: 5, // We start with exactly 5 items
      weight: 10.0,
      status: 'AVAILABLE'
    }
  });

  console.log(`Initialized Test Product: ${product.sku} with Lot Qty: 5`);

  // 2. Perform Simultaneous Deductions (The Race Condition test)
  // We will fire 10 simultaneous requests to deduct 1 item each.
  // Since we only have 5 in stock, exactly 5 should succeed and 5 should fail with 45000.
  
  const deductionPromises = [];
  
  console.log('Firing 10 simultaneous stock deduction requests...');
  for (let i = 0; i < 10; i++) {
    deductionPromises.push(
      InventoryService.processStockMovement({
        productId: product.id,
        lotId: lot.id,
        type: 'SALE',
        fromLocationId: location.id,
        quantityDelta: -1,
        weightDelta: 0,
        userId: user.id
      })
      .then(() => ({ status: 'SUCCESS' }))
      .catch((err) => ({ status: 'FAILED', message: err.message }))
    );
  }

  const results = await Promise.all(deductionPromises);
  
  const successes = results.filter(r => r.status === 'SUCCESS').length;
  const failures = results.filter(r => r.status === 'FAILED').length;

  console.log(`\nResults:`);
  console.log(`Successes: ${successes} (Expected: 5)`);
  console.log(`Failures : ${failures} (Expected: 5)`);

  const finalLot = await prisma.inventoryLot.findUnique({ where: { id: lot.id } });
  console.log(`Final Database Qty: ${finalLot?.quantity} (Expected: 0)`);

  if (successes === 5 && finalLot?.quantity === 0) {
    console.log('\n✅ RACE CONDITION PREVENTION PASSED!');
    console.log('✅ NEGATIVE STOCK PREVENTION PASSED!');
  } else {
    console.log('\n❌ TEST FAILED. Race condition detected!');
  }

  process.exit(0);
}

runConcurrencyTest().catch(console.error);
