import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export class InventoryService {
  /**
   * Prisma CRUD: Create a new product
   */
  static async createProduct(data: any) {
    return prisma.product.create({
      data,
    });
  }

  /**
   * Prisma CRUD: Get all products
   */
  static async getProducts(skip = 0, take = 50) {
    return prisma.product.findMany({
      skip,
      take,
      include: {
        lots: true,
      },
    });
  }

  /**
   * Prisma CRUD: Get stock ledger audit trail
   */
  static async getMovements(skip = 0, take = 100) {
    return prisma.stockMovement.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        product: true,
        lot: true,
        user: { select: { name: true, email: true } },
      },
    });
  }

  /**
   * Stored Procedure: Process a stock movement
   */
  static async processStockMovement(data: {
    id?: string;
    productId: string;
    lotId?: string;
    transactionId?: string;
    type: string;
    fromLocationId?: string;
    toLocationId?: string;
    quantityDelta: number;
    weightDelta: number;
    userId: string;
  }) {
    const movementId = data.id || uuidv4();
    
    // Using Prisma raw query to execute MySQL Stored Procedure
    await prisma.$executeRaw`
      CALL sp_ProcessStockMovement(
        ${movementId},
        ${data.productId},
        ${data.lotId || null},
        ${data.transactionId || null},
        ${data.type},
        ${data.fromLocationId || null},
        ${data.toLocationId || null},
        ${data.quantityDelta},
        ${data.weightDelta},
        ${data.userId}
      )
    `;

    return { movementId, status: 'SUCCESS' };
  }

  /**
   * Stored Procedure: Transfer stock atomically
   */
  static async transferStock(data: {
    productId: string;
    lotId?: string;
    transactionId?: string;
    fromLocationId: string;
    toLocationId: string;
    quantity: number;
    weight: number;
    userId: string;
  }) {
    const outId = uuidv4();
    const inId = uuidv4();

    await prisma.$executeRaw`
      CALL sp_TransferStock(
        ${outId},
        ${inId},
        ${data.productId},
        ${data.lotId || null},
        ${data.transactionId || null},
        ${data.fromLocationId},
        ${data.toLocationId},
        ${data.quantity},
        ${data.weight},
        ${data.userId}
      )
    `;

    return { outId, inId, status: 'SUCCESS' };
  }

  /**
   * Stored Procedure: Reverse a movement
   */
  static async reverseMovement(originalMovementId: string, userId: string) {
    const newMovementId = uuidv4();

    await prisma.$executeRaw`
      CALL sp_ReverseStockMovement(
        ${originalMovementId},
        ${newMovementId},
        ${userId}
      )
    `;
    return { newMovementId, status: 'SUCCESS' };
  }

  /**
   * Dashboard Stats: Calculate summary metrics
   */
  static async getDashboardStats() {
    const [totalProducts, totalLots, recentMovements] = await Promise.all([
      prisma.product.count(),
      prisma.inventoryLot.aggregate({
        _sum: {
          quantity: true,
          weight: true,
        },
      }),
      prisma.stockMovement.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true, sku: true } },
          user: { select: { name: true } },
        },
      }),
    ]);

    const lowStockItems = await prisma.inventoryLot.findMany({
      where: { quantity: { lte: 10 } }, // Hardcoded threshold for now
      include: { product: true },
      take: 5,
    });

    return {
      totalProducts,
      totalQuantity: totalLots._sum.quantity || 0,
      totalWeight: totalLots._sum.weight || 0,
      recentMovements,
      lowStockItems,
    };
  }
}
