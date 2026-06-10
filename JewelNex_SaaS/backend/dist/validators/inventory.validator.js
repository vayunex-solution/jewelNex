"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stockTransferSchema = exports.stockMovementSchema = exports.createProductSchema = void 0;
const zod_1 = require("zod");
exports.createProductSchema = zod_1.z.object({
    sku: zod_1.z.string().min(1, 'SKU is required'),
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    description: zod_1.z.string().optional(),
    grossWeight: zod_1.z.number().min(0).default(0),
    stoneWeight: zod_1.z.number().min(0).default(0),
    netWeight: zod_1.z.number().min(0).default(0),
    purity: zod_1.z.number().min(0).max(1).default(1.0),
    fineWeight: zod_1.z.number().min(0).default(0),
    wastagePercent: zod_1.z.number().min(0).default(0),
    makingCharge: zod_1.z.number().min(0).default(0),
});
exports.stockMovementSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid('Invalid product ID'),
    lotId: zod_1.z.string().uuid('Invalid lot ID').optional(),
    transactionId: zod_1.z.string().uuid('Invalid transaction ID').optional(),
    type: zod_1.z.enum(['OPENING', 'PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT']),
    fromLocationId: zod_1.z.string().uuid('Invalid location ID').optional(),
    toLocationId: zod_1.z.string().uuid('Invalid location ID').optional(),
    quantityDelta: zod_1.z.number().int(),
    weightDelta: zod_1.z.number(),
});
exports.stockTransferSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid('Invalid product ID'),
    lotId: zod_1.z.string().uuid('Invalid lot ID').optional(),
    transactionId: zod_1.z.string().uuid('Invalid transaction ID').optional(),
    fromLocationId: zod_1.z.string().uuid('Invalid location ID'),
    toLocationId: zod_1.z.string().uuid('Invalid location ID'),
    quantity: zod_1.z.number().int().positive(),
    weight: zod_1.z.number().positive(),
});
//# sourceMappingURL=inventory.validator.js.map