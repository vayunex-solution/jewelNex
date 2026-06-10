"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountingController = void 0;
const accounting_service_1 = require("../services/accounting.service");
const database_1 = __importDefault(require("../config/database"));
/** Safely coerce a ParsedQs query param value to a string */
const qs = (v) => typeof v === 'string' ? v : Array.isArray(v) ? String(v[0]) : undefined;
class AccountingController {
    static async initializeCOA(req, res, next) {
        try {
            await accounting_service_1.AccountingService.initializeChartOfAccounts();
            res.status(200).json({ success: true, message: 'Chart of Accounts initialized successfully.' });
        }
        catch (error) {
            next(error);
        }
    }
    static async getGroups(req, res, next) {
        try {
            const groups = await database_1.default.accountGroup.findMany({
                include: { subGroups: true }
            });
            res.status(200).json({ success: true, data: groups });
        }
        catch (error) {
            next(error);
        }
    }
    static async getHeads(req, res, next) {
        try {
            const heads = await database_1.default.accountHead.findMany({
                include: { group: true }
            });
            res.status(200).json({ success: true, data: heads });
        }
        catch (error) {
            next(error);
        }
    }
    static async getLedger(req, res, next) {
        try {
            const { accountId } = req.params;
            const head = await database_1.default.accountHead.findUnique({
                where: { id: qs(req.query.accountId) ?? '' },
                include: { group: true }
            });
            if (!head) {
                res.status(404).json({ success: false, message: 'Account head not found.' });
                return;
            }
            const entries = await database_1.default.voucherEntry.findMany({
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
            const balance = await accounting_service_1.AccountingService.getAccountBalance(qs(req.params.accountId) ?? '');
            res.status(200).json({
                success: true,
                data: {
                    head,
                    balance,
                    entries
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getCustomerBalance(req, res, next) {
        try {
            const { customerId } = req.params;
            const balance = await accounting_service_1.AccountingService.getCustomerBalance(qs(customerId) ?? '');
            res.status(200).json({ success: true, customerId, balance });
        }
        catch (error) {
            next(error);
        }
    }
    static async getDayBookReport(req, res, next) {
        try {
            const { startDate, endDate } = req.query;
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;
            const data = await accounting_service_1.AccountingService.getDayBook(start, end);
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    }
    static async getGeneralLedgerReport(req, res, next) {
        try {
            const { accountId } = req.params;
            const { startDate, endDate } = req.query;
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;
            const data = await accounting_service_1.AccountingService.getGeneralLedger(qs(req.params.accountId) ?? '', start, end);
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    }
    static async getCashBookReport(req, res, next) {
        try {
            const { startDate, endDate } = req.query;
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;
            const cashHead = await database_1.default.accountHead.findFirst({ where: { name: 'Cash Account' } });
            if (!cashHead) {
                res.status(404).json({ success: false, message: 'Cash Account head not seeded.' });
                return;
            }
            const data = await accounting_service_1.AccountingService.getGeneralLedger(cashHead.id, start, end);
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    }
    static async getBankBookReport(req, res, next) {
        try {
            const { startDate, endDate } = req.query;
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;
            const bankHead = await database_1.default.accountHead.findFirst({ where: { name: 'HDFC Bank' } });
            if (!bankHead) {
                res.status(404).json({ success: false, message: 'Bank Account head not seeded.' });
                return;
            }
            const data = await accounting_service_1.AccountingService.getGeneralLedger(bankHead.id, start, end);
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    }
    static async getTrialBalanceReport(req, res, next) {
        try {
            const { date } = req.query;
            const limitDate = date ? new Date(date) : undefined;
            const data = await accounting_service_1.AccountingService.getTrialBalance(limitDate);
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    }
    static async getProfitLossReport(req, res, next) {
        try {
            const { startDate, endDate } = req.query;
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;
            const data = await accounting_service_1.AccountingService.getProfitLoss(start, end);
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    }
    static async getBalanceSheetReport(req, res, next) {
        try {
            const { date } = req.query;
            const limitDate = date ? new Date(date) : undefined;
            const data = await accounting_service_1.AccountingService.getBalanceSheet(limitDate);
            res.status(200).json({ success: true, data });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AccountingController = AccountingController;
//# sourceMappingURL=accounting.controller.js.map