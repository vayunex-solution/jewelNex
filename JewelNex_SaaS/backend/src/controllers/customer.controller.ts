import { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../services/customer.service';

export class CustomerController {
  static async createCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await CustomerService.createCustomer(req.body);
      res.status(201).json({ success: true, data: customer });
    } catch (error) {
      next(error);
    }
  }

  static async searchCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const { q } = req.query;
      const customers = await CustomerService.searchCustomers(String(q || ''));
      res.status(200).json({ success: true, data: customers });
    } catch (error) {
      next(error);
    }
  }
}
