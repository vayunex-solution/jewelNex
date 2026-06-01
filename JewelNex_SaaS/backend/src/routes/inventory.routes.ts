import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { validate } from '../middlewares/validate.middleware';
import { createProductSchema, stockMovementSchema, stockTransferSchema } from '../validators/inventory.validator';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Products CRUD
router.post('/products', authenticate, authorize('admin', 'manager'), validate(createProductSchema), InventoryController.createProduct);
router.get('/products', authenticate, InventoryController.getProducts);

// Ledger Audit Trail
router.get('/movements', authenticate, InventoryController.getMovements);

// Atomic Inventory Transactions (Require Admin/Manager)
router.post('/movements', authenticate, authorize('admin', 'manager'), validate(stockMovementSchema), InventoryController.recordMovement);
router.post('/transfer', authenticate, authorize('admin', 'manager'), validate(stockTransferSchema), InventoryController.transferStock);

// Dashboard Stats
router.get('/stats', authenticate, InventoryController.getDashboardStats);

export default router;
