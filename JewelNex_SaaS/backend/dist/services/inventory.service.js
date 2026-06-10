"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const database_1 = __importDefault(require("../config/database"));
const uuid_1 = require("uuid");
class InventoryService {
    /**
     * Prisma CRUD: Create a new product
     */
    static async createProduct(data) {
        return database_1.default.product.create({
            data,
        });
    }
    /**
     * Prisma CRUD: Get all products
     */
    static async getProducts(skip = 0, take = 50) {
        return database_1.default.product.findMany({
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
        return database_1.default.stockMovement.findMany({
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
    static async processStockMovement(data) {
        const movementId = data.id || (0, uuid_1.v4)();
        // Using Prisma raw query to execute MySQL Stored Procedure
        await database_1.default.$executeRaw `
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
    static async transferStock(data) {
        const outId = (0, uuid_1.v4)();
        const inId = (0, uuid_1.v4)();
        await database_1.default.$executeRaw `
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
    static async reverseMovement(originalMovementId, userId) {
        const newMovementId = (0, uuid_1.v4)();
        await database_1.default.$executeRaw `
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
            database_1.default.product.count(),
            database_1.default.inventoryLot.aggregate({
                _sum: {
                    quantity: true,
                    weight: true,
                },
            }),
            database_1.default.stockMovement.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    product: { select: { name: true, sku: true } },
                    user: { select: { name: true } },
                },
            }),
        ]);
        const lowStockItems = await database_1.default.inventoryLot.findMany({
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
exports.InventoryService = InventoryService;
//# sourceMappingURL=inventory.service.js.map