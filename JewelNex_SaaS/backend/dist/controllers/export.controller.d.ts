import { Request, Response, NextFunction } from 'express';
export declare class ExportController {
    static trialBalanceXLSX(req: Request, res: Response, next: NextFunction): Promise<void>;
    static dayBookXLSX(req: Request, res: Response, next: NextFunction): Promise<void>;
    static generalLedgerXLSX(req: Request, res: Response, next: NextFunction): Promise<void>;
    static invoiceRegisterCSV(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=export.controller.d.ts.map