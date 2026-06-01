import { Request, Response, NextFunction } from 'express';
import { ExportService } from '../services/export.service';

export class ExportController {
  // GET /api/v1/export/trial-balance.xlsx
  static async trialBalanceXLSX(req: Request, res: Response, next: NextFunction) {
    try {
      const date = req.query.date ? new Date(req.query.date as string) : undefined;
      const workbook = await ExportService.exportTrialBalanceXLSX(date);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="trial_balance_${new Date().toISOString().slice(0, 10)}.xlsx"`);
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/export/daybook.xlsx
  static async dayBookXLSX(req: Request, res: Response, next: NextFunction) {
    try {
      const start = req.query.start ? new Date(req.query.start as string) : undefined;
      const end = req.query.end ? new Date(req.query.end as string) : undefined;
      const workbook = await ExportService.exportDayBookXLSX(start, end);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="daybook_${new Date().toISOString().slice(0, 10)}.xlsx"`);
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/export/ledger/:accountId.xlsx
  static async generalLedgerXLSX(req: Request, res: Response, next: NextFunction) {
    try {
      const { accountId } = req.params as Record<string, string>;
      const start = req.query.start ? new Date(req.query.start as string) : undefined;
      const end = req.query.end ? new Date(req.query.end as string) : undefined;
      const workbook = await ExportService.exportGeneralLedgerXLSX(accountId, start, end);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="ledger_${accountId.slice(0, 8)}_${new Date().toISOString().slice(0, 10)}.xlsx"`);
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/export/invoices.csv
  static async invoiceRegisterCSV(req: Request, res: Response, next: NextFunction) {
    try {
      const start = req.query.start ? new Date(req.query.start as string) : undefined;
      const end = req.query.end ? new Date(req.query.end as string) : undefined;
      const csv = await ExportService.exportInvoiceRegisterCSV(start, end);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="invoice_register_${new Date().toISOString().slice(0, 10)}.csv"`);
      res.send('\uFEFF' + csv); // BOM for Excel UTF-8 compatibility
    } catch (error) {
      next(error);
    }
  }
}
