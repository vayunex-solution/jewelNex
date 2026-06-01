import prisma from './src/config/database';

async function test() {
  console.log("Testing Prisma queries...");
  try {
    console.log("1. product.count()");
    const c1 = await prisma.product.count();
    console.log("Product count:", c1);

    console.log("2. inventoryLot.aggregate()");
    const a1 = await prisma.inventoryLot.aggregate({
      _sum: { quantity: true, weight: true },
    });
    console.log("Aggregate:", a1);

    console.log("3. stockMovement.findMany()");
    const m1 = await prisma.stockMovement.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true, sku: true } },
        user: { select: { name: true } },
      },
    });
    console.log("Movements:", m1.length);

    console.log("4. inventoryLot.findMany()");
    const l1 = await prisma.inventoryLot.findMany({
      where: { quantity: { lte: 10 } },
      include: { product: true },
      take: 5,
    });
    console.log("Low stock:", l1.length);
    
    console.log("All done!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
