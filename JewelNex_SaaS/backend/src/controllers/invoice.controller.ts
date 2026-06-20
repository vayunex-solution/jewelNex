import { Request, Response, NextFunction } from 'express';
import { InvoiceService, CreateInvoiceDTO } from '../services/invoice.service';
import { PDFService } from '../services/pdf.service';
import prisma from '../config/database';

const qs = (v: unknown): string | undefined =>
  typeof v === 'string' ? v : Array.isArray(v) ? String(v[0]) : undefined;

export class InvoiceController {
  static async createInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: CreateInvoiceDTO = req.body;
      const userId = req.user!.userId; // From authenticate middleware
      // @ts-ignore
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ success: false, message: 'Unauthorized: No company associated.' });
      }

      const invoice = await InvoiceService.postInvoice(dto, userId, companyId);

      res.status(201).json({
        success: true,
        message: 'Invoice posted successfully',
        data: invoice
      });
    } catch (error) {
      next(error);
    }
  }

  static async reverseInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as Record<string, string>;
      const userId = req.user!.userId;

      const result = await InvoiceService.reverseInvoice(id, userId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async saveDraft(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: CreateInvoiceDTO = req.body;
      const userId = req.user!.userId;
      // @ts-ignore
      const companyId = req.user?.companyId;
      if (!companyId) {
        return res.status(401).json({ success: false, message: 'Unauthorized: No company associated.' });
      }

      const invoice = await InvoiceService.saveDraft(dto, userId, companyId);

      res.status(201).json({
        success: true,
        message: 'Draft invoice saved successfully',
        data: invoice
      });
    } catch (error) {
      next(error);
    }
  }

  static async editDraft(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as Record<string, string>;
      const dto: CreateInvoiceDTO = req.body;
      const userId = req.user!.userId;

      const invoice = await InvoiceService.editDraft(id, dto, userId);

      res.status(200).json({
        success: true,
        message: 'Draft invoice updated successfully',
        data: invoice
      });
    } catch (error) {
      next(error);
    }
  }

  static async postDraft(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as Record<string, string>;
      const { payments } = req.body;
      const userId = req.user!.userId;

      const invoice = await InvoiceService.postDraft(id, userId, payments);

      res.status(200).json({
        success: true,
        message: 'Draft invoice posted successfully',
        data: invoice
      });
    } catch (error) {
      next(error);
    }
  }

  static async listDrafts(req: Request, res: Response, next: NextFunction) {
    try {
      // @ts-ignore
      const companyId = req.user?.companyId;
      const drafts = await InvoiceService.listDrafts(companyId);

      res.status(200).json({
        success: true,
        data: drafts
      });
    } catch (error) {
      next(error);
    }
  }

  static async listPostedInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, start, end, page = '1', limit = '20' } = req.query as Record<string, string>;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      // @ts-ignore
      const companyId = req.user?.companyId;

      const where: any = { status: { not: 'DRAFT' } };
      where.companyId = companyId || 'NO_COMPANY_ACCESS';
      if (type) where.type = type;
      if (start || end) {
        where.createdAt = {};
        if (start) where.createdAt.gte = new Date(start);
        if (end) where.createdAt.lte = new Date(end);
      }

      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          include: { customer: true, payments: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.invoice.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: invoices,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getInvoiceById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as Record<string, string>;
      // @ts-ignore
      const companyId = req.user?.companyId;
      const invoice = await prisma.invoice.findUnique({
        where: { id, companyId: companyId || 'NO_COMPANY_ACCESS' },
        include: { customer: true, items: { include: { product: true } }, payments: true }
      });
      if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
      res.status(200).json({ success: true, data: invoice });
    } catch (error) {
      next(error);
    }
  }

  static async downloadInvoicePDF(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params as Record<string, string>;
      // @ts-ignore
      const companyId = req.user?.companyId;
      const invoice = await prisma.invoice.findUnique({
        where: { id, companyId: companyId || 'NO_COMPANY_ACCESS' },
        select: { id: true }
      });
      if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

      const stream = await PDFService.generateInvoicePDF(id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="invoice_${id.slice(0, 8)}.pdf"`);
      (stream as any).pipe(res);
    } catch (error) {
      next(error);
    }
  }
}
