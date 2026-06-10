import { Request, Response, NextFunction } from 'express';
export declare class AccountingController {
    static initializeCOA(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getGroups(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getHeads(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getLedger(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getCustomerBalance(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getDayBookReport(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getGeneralLedgerReport(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getCashBookReport(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getBankBookReport(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getTrialBalanceReport(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getProfitLossReport(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getBalanceSheetReport(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=accounting.controller.d.ts.map