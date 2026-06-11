"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryController = void 0;
const inventory_service_1 = require("../services/inventory.service");
class InventoryController {
    static async createProduct(req, res) {
        try {
            // @ts-ignore
            const companyId = req.user?.companyId;
            if (!companyId) {
                return res.status(401).json({ success: false, message: 'Unauthorized: No company associated.' });
            }
            const product = await inventory_service_1.InventoryService.createProduct(req.body, companyId);
            res.status(201).json({ success: true, data: product });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async getProducts(req, res) {
        try {
            const skip = parseInt(req.query.skip) || 0;
            const take = parseInt(req.query.take) || 50;
            // @ts-ignore
            const companyId = req.user?.companyId;
            const products = await inventory_service_1.InventoryService.getProducts(skip, take, companyId);
            res.status(200).json({ success: true, data: products });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async getMovements(req, res) {
        try {
            const skip = parseInt(req.query.skip) || 0;
            const take = parseInt(req.query.take) || 100;
            // @ts-ignore
            const companyId = req.user?.companyId;
            const movements = await inventory_service_1.InventoryService.getMovements(skip, take, companyId);
            res.status(200).json({ success: true, data: movements });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async recordMovement(req, res) {
        try {
            // @ts-ignore - req.user is set by auth middleware
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const result = await inventory_service_1.InventoryService.processStockMovement({
                ...req.body,
                userId
            });
            res.status(201).json({ success: true, data: result });
        }
        catch (error) {
            // If SP throws 45000 signal, it will be caught here
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async transferStock(req, res) {
        try {
            // @ts-ignore
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'Unauthorized' });
            }
            const result = await inventory_service_1.InventoryService.transferStock({
                ...req.body,
                userId
            });
            res.status(201).json({ success: true, data: result });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
    static async getDashboardStats(req, res) {
        try {
            // @ts-ignore
            const companyId = req.user?.companyId;
            const stats = await inventory_service_1.InventoryService.getDashboardStats(companyId);
            res.status(200).json({ success: true, data: stats });
        }
        catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }
}
exports.InventoryController = InventoryController;
//# sourceMappingURL=inventory.controller.js.map