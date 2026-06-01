import { Request, Response, NextFunction } from 'express';
import { AccountingService } from '../services/accounting.service';
import prisma from '../config/database';

/** Safely coerce a ParsedQs query param value to a string */
const qs = (v: unknown): string | undefined =>
  typeof v === 'string' ? v : Array.isArray(v) ? String(v[0]) : undefined;

export class AccountingController {
  static async initializeCOA(req: Request, res: Response, next: NextFunction) {
    try {
      await AccountingService.initializeChartOfAccounts();
      res.status(200).json({ success: true, message: 'Chart of Accounts initialized successfully.' });
    } catch (error) {
      next(error);
    }
  }

  static async getGroups(req: Request, res: Response, next: NextFunction) {
    try {
      const groups = await prisma.accountGroup.findMany({
        include: { subGroups: true }
      });
      res.status(200).json({ success: true, data: groups });
    } catch (error) {
      next(error);
    }
  }

  static async getHeads(req: Request, res: Response, next: NextFunction) {
    try {
      const heads = await prisma.accountHead.findMany({
        include: { group: true }
      });
      res.status(200).json({ success: true, data: heads });
    } catch (error) {
      next(error);
    }
  }

  static async getLedger(req: Request, res: Response, next: NextFunction) {
    try {
      const { accountId } = req.params;

      const head = await prisma.accountHead.findUnique({
        where: { id: qs(req.query.accountId) ?? '' },
        include: { group: true }
      });

      if (!head) {
        res.status(404).json({ success: false, message: 'Account head not found.' });
        return;
      }

      const entries = await prisma.voucherEntry.findMany({
        where: { accountId: qs(req.params.accountId) ?? '' },
        include: {
          voucher: {
            select: {
              voucherNumber: true,
              type: true,
              date: true,
              reference: true,
              narration: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      const balance = await AccountingService.getAccountBalance(qs(req.params.accountId) ?? '');

      res.status(200).json({
        success: true,
        data: {
          head,
          balance,
          entries
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCustomerBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId } = req.params;
      const balance = await AccountingService.getCustomerBalance(qs(customerId) ?? '');
      res.status(200).json({ success: true, customerId, balance });
    } catch (error) {
      next(error);
    }
  }

  static async getDayBookReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      const data = await AccountingService.getDayBook(start, end);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getGeneralLedgerReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { accountId } = req.params;
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      const data = await AccountingService.getGeneralLedger(qs(req.params.accountId) ?? '', start, end);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getCashBookReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const cashHead = await prisma.accountHead.findFirst({ where: { name: 'Cash Account' } });
      if (!cashHead) {
        res.status(404).json({ success: false, message: 'Cash Account head not seeded.' });
        return;
      }

      const data = await AccountingService.getGeneralLedger(cashHead.id, start, end);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getBankBookReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;

      const bankHead = await prisma.accountHead.findFirst({ where: { name: 'HDFC Bank' } });
      if (!bankHead) {
        res.status(404).json({ success: false, message: 'Bank Account head not seeded.' });
        return;
      }

      const data = await AccountingService.getGeneralLedger(bankHead.id, start, end);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getTrialBalanceReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { date } = req.query;
      const limitDate = date ? new Date(date as string) : undefined;
      const data = await AccountingService.getTrialBalance(limitDate);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getProfitLossReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      const data = await AccountingService.getProfitLoss(start, end);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  static async getBalanceSheetReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { date } = req.query;
      const limitDate = date ? new Date(date as string) : undefined;
      const data = await AccountingService.getBalanceSheet(limitDate);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
