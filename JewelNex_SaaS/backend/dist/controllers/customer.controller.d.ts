import { Request, Response, NextFunction } from 'express';
export declare class CustomerController {
    static createCustomer(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    static searchCustomers(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=customer.controller.d.ts.map