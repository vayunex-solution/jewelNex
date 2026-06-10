"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inventory_controller_1 = require("../controllers/inventory.controller");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const inventory_validator_1 = require("../validators/inventory.validator");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Products CRUD
router.post('/products', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'manager'), (0, validate_middleware_1.validate)(inventory_validator_1.createProductSchema), inventory_controller_1.InventoryController.createProduct);
router.get('/products', auth_middleware_1.authenticate, inventory_controller_1.InventoryController.getProducts);
// Ledger Audit Trail
router.get('/movements', auth_middleware_1.authenticate, inventory_controller_1.InventoryController.getMovements);
// Atomic Inventory Transactions (Require Admin/Manager)
router.post('/movements', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'manager'), (0, validate_middleware_1.validate)(inventory_validator_1.stockMovementSchema), inventory_controller_1.InventoryController.recordMovement);
router.post('/transfer', auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)('admin', 'manager'), (0, validate_middleware_1.validate)(inventory_validator_1.stockTransferSchema), inventory_controller_1.InventoryController.transferStock);
// Dashboard Stats
router.get('/stats', auth_middleware_1.authenticate, inventory_controller_1.InventoryController.getDashboardStats);
exports.default = router;
//# sourceMappingURL=inventory.routes.js.map