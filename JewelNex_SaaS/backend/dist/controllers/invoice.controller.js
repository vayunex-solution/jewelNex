"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceController = void 0;
const invoice_service_1 = require("../services/invoice.service");
const pdf_service_1 = require("../services/pdf.service");
const database_1 = __importDefault(require("../config/database"));
const qs = (v) => typeof v === 'string' ? v : Array.isArray(v) ? String(v[0]) : undefined;
class InvoiceController {
    static async createInvoice(req, res, next) {
        try {
            const dto = req.body;
            const userId = req.user.userId; // From authenticate middleware
            // @ts-ignore
            const companyId = req.user?.companyId;
            if (!companyId) {
                return res.status(401).json({ success: false, message: 'Unauthorized: No company associated.' });
            }
            const invoice = await invoice_service_1.InvoiceService.postInvoice(dto, userId, companyId);
            res.status(201).json({
                success: true,
                message: 'Invoice posted successfully',
                data: invoice
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async reverseInvoice(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;
            const result = await invoice_service_1.InvoiceService.reverseInvoice(id, userId);
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    static async saveDraft(req, res, next) {
        try {
            const dto = req.body;
            const userId = req.user.userId;
            // @ts-ignore
            const companyId = req.user?.companyId;
            if (!companyId) {
                return res.status(401).json({ success: false, message: 'Unauthorized: No company associated.' });
            }
            const invoice = await invoice_service_1.InvoiceService.saveDraft(dto, userId, companyId);
            res.status(201).json({
                success: true,
                message: 'Draft invoice saved successfully',
                data: invoice
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async editDraft(req, res, next) {
        try {
            const { id } = req.params;
            const dto = req.body;
            const userId = req.user.userId;
            const invoice = await invoice_service_1.InvoiceService.editDraft(id, dto, userId);
            res.status(200).json({
                success: true,
                message: 'Draft invoice updated successfully',
                data: invoice
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async postDraft(req, res, next) {
        try {
            const { id } = req.params;
            const { payments } = req.body;
            const userId = req.user.userId;
            const invoice = await invoice_service_1.InvoiceService.postDraft(id, userId, payments);
            res.status(200).json({
                success: true,
                message: 'Draft invoice posted successfully',
                data: invoice
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async listDrafts(req, res, next) {
        try {
            // @ts-ignore
            const companyId = req.user?.companyId;
            const drafts = await invoice_service_1.InvoiceService.listDrafts(companyId);
            res.status(200).json({
                success: true,
                data: drafts
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async listPostedInvoices(req, res, next) {
        try {
            const { type, start, end, page = '1', limit = '20' } = req.query;
            const skip = (parseInt(page) - 1) * parseInt(limit);
            // @ts-ignore
            const companyId = req.user?.companyId;
            const where = { status: { not: 'DRAFT' } };
            where.companyId = companyId || 'NO_COMPANY_ACCESS';
            if (type)
                where.type = type;
            if (start || end) {
                where.createdAt = {};
                if (start)
                    where.createdAt.gte = new Date(start);
                if (end)
                    where.createdAt.lte = new Date(end);
            }
            const [invoices, total] = await Promise.all([
                database_1.default.invoice.findMany({
                    where,
                    include: { customer: true, payments: true },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: parseInt(limit),
                }),
                database_1.default.invoice.count({ where }),
            ]);
            res.status(200).json({
                success: true,
                data: invoices,
                pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) }
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getInvoiceById(req, res, next) {
        try {
            const { id } = req.params;
            // @ts-ignore
            const companyId = req.user?.companyId;
            const invoice = await database_1.default.invoice.findUnique({
                where: { id, companyId: companyId || 'NO_COMPANY_ACCESS' },
                include: { customer: true, items: { include: { product: true } }, payments: true }
            });
            if (!invoice)
                return res.status(404).json({ success: false, message: 'Invoice not found' });
            res.status(200).json({ success: true, data: invoice });
        }
        catch (error) {
            next(error);
        }
    }
    static async downloadInvoicePDF(req, res, next) {
        try {
            const { id } = req.params;
            // @ts-ignore
            const companyId = req.user?.companyId;
            const invoice = await database_1.default.invoice.findUnique({
                where: { id, companyId: companyId || 'NO_COMPANY_ACCESS' },
                select: { id: true }
            });
            if (!invoice)
                return res.status(404).json({ success: false, message: 'Invoice not found' });
            const stream = await pdf_service_1.PDFService.generateInvoicePDF(id);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="invoice_${id.slice(0, 8)}.pdf"`);
            stream.pipe(res);
        }
        catch (error) {
            next(error);
        }
    }
}
exports.InvoiceController = InvoiceController;
//# sourceMappingURL=invoice.controller.js.map