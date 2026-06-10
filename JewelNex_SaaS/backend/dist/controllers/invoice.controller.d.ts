import { Request, Response, NextFunction } from 'express';
export declare class InvoiceController {
    static createInvoice(req: Request, res: Response, next: NextFunction): Promise<void>;
    static reverseInvoice(req: Request, res: Response, next: NextFunction): Promise<void>;
    static saveDraft(req: Request, res: Response, next: NextFunction): Promise<void>;
    static editDraft(req: Request, res: Response, next: NextFunction): Promise<void>;
    static postDraft(req: Request, res: Response, next: NextFunction): Promise<void>;
    static listDrafts(req: Request, res: Response, next: NextFunction): Promise<void>;
    static listPostedInvoices(req: Request, res: Response, next: NextFunction): Promise<void>;
    static getInvoiceById(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    static downloadInvoicePDF(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=invoice.controller.d.ts.map