import { Request, Response } from 'express';
export declare class InventoryController {
    static createProduct(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getProducts(req: Request, res: Response): Promise<void>;
    static getMovements(req: Request, res: Response): Promise<void>;
    static recordMovement(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static transferStock(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static getDashboardStats(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=inventory.controller.d.ts.map