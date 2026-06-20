import { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../services/customer.service';

export class CustomerController {
  static async createCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      // @ts-ignore
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ success: false, message: 'Unauthorized: No company associated.' });
      }
      const customer = await CustomerService.createCustomer(req.body, companyId);
      res.status(201).json({ success: true, data: customer });
    } catch (error) {
      next(error);
    }
  }

  static async searchCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const { q } = req.query;
      // @ts-ignore
      const companyId = req.user?.companyId;
      const customers = await CustomerService.searchCustomers(String(q || ''), companyId);
      console.log('DEBUG [searchCustomers]: q =', q, 'companyId =', companyId, 'resultsCount =', customers.length);
      res.status(200).json({ success: true, data: customers });
    } catch (error) {
      next(error);
    }
  }
}
