import { Request, Response } from 'express';
import { InventoryService } from '../services/inventory.service';

export class InventoryController {
  
  static async createProduct(req: Request, res: Response) {
    try {
      // @ts-ignore
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ success: false, message: 'Unauthorized: No company associated.' });
      }
      const product = await InventoryService.createProduct(req.body, companyId);
      res.status(201).json({ success: true, data: product });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getProducts(req: Request, res: Response) {
    try {
      const skip = parseInt(req.query.skip as string) || 0;
      const take = parseInt(req.query.take as string) || 50;
      // @ts-ignore
      const companyId = req.user?.companyId;
      const products = await InventoryService.getProducts(skip, take, companyId);
      res.status(200).json({ success: true, data: products });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getMovements(req: Request, res: Response) {
    try {
      const skip = parseInt(req.query.skip as string) || 0;
      const take = parseInt(req.query.take as string) || 100;
      // @ts-ignore
      const companyId = req.user?.companyId;
      const movements = await InventoryService.getMovements(skip, take, companyId);
      res.status(200).json({ success: true, data: movements });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async recordMovement(req: Request, res: Response) {
    try {
      // @ts-ignore - req.user is set by auth middleware
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const result = await InventoryService.processStockMovement({
        ...req.body,
        userId
      });

      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      // If SP throws 45000 signal, it will be caught here
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async transferStock(req: Request, res: Response) {
    try {
      // @ts-ignore
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const result = await InventoryService.transferStock({
        ...req.body,
        userId
      });

      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getDashboardStats(req: Request, res: Response) {
    try {
      // @ts-ignore
      const companyId = req.user?.companyId;
      const stats = await InventoryService.getDashboardStats(companyId);
      res.status(200).json({ success: true, data: stats });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}
