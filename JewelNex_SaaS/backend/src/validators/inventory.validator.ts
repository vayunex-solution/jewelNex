import { z } from 'zod';

export const createProductSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  grossWeight: z.number().min(0).default(0),
  stoneWeight: z.number().min(0).default(0),
  netWeight: z.number().min(0).default(0),
  purity: z.number().min(0).max(1).default(1.0),
  fineWeight: z.number().min(0).default(0),
  wastagePercent: z.number().min(0).default(0),
  makingCharge: z.number().min(0).default(0),
});

export const stockMovementSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  lotId: z.string().uuid('Invalid lot ID').optional(),
  transactionId: z.string().uuid('Invalid transaction ID').optional(),
  type: z.enum(['OPENING', 'PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT']),
  fromLocationId: z.string().uuid('Invalid location ID').optional(),
  toLocationId: z.string().uuid('Invalid location ID').optional(),
  quantityDelta: z.number().int(),
  weightDelta: z.number(),
});

export const stockTransferSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  lotId: z.string().uuid('Invalid lot ID').optional(),
  transactionId: z.string().uuid('Invalid transaction ID').optional(),
  fromLocationId: z.string().uuid('Invalid location ID'),
  toLocationId: z.string().uuid('Invalid location ID'),
  quantity: z.number().int().positive(),
  weight: z.number().positive(),
});
