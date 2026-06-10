"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportController = void 0;
const export_service_1 = require("../services/export.service");
class ExportController {
    // GET /api/v1/export/trial-balance.xlsx
    static async trialBalanceXLSX(req, res, next) {
        try {
            const date = req.query.date ? new Date(req.query.date) : undefined;
            const workbook = await export_service_1.ExportService.exportTrialBalanceXLSX(date);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="trial_balance_${new Date().toISOString().slice(0, 10)}.xlsx"`);
            await workbook.xlsx.write(res);
            res.end();
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/v1/export/daybook.xlsx
    static async dayBookXLSX(req, res, next) {
        try {
            const start = req.query.start ? new Date(req.query.start) : undefined;
            const end = req.query.end ? new Date(req.query.end) : undefined;
            const workbook = await export_service_1.ExportService.exportDayBookXLSX(start, end);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="daybook_${new Date().toISOString().slice(0, 10)}.xlsx"`);
            await workbook.xlsx.write(res);
            res.end();
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/v1/export/ledger/:accountId.xlsx
    static async generalLedgerXLSX(req, res, next) {
        try {
            const { accountId } = req.params;
            const start = req.query.start ? new Date(req.query.start) : undefined;
            const end = req.query.end ? new Date(req.query.end) : undefined;
            const workbook = await export_service_1.ExportService.exportGeneralLedgerXLSX(accountId, start, end);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="ledger_${accountId.slice(0, 8)}_${new Date().toISOString().slice(0, 10)}.xlsx"`);
            await workbook.xlsx.write(res);
            res.end();
        }
        catch (error) {
            next(error);
        }
    }
    // GET /api/v1/export/invoices.csv
    static async invoiceRegisterCSV(req, res, next) {
        try {
            const start = req.query.start ? new Date(req.query.start) : undefined;
            const end = req.query.end ? new Date(req.query.end) : undefined;
            const csv = await export_service_1.ExportService.exportInvoiceRegisterCSV(start, end);
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="invoice_register_${new Date().toISOString().slice(0, 10)}.csv"`);
            res.send('\uFEFF' + csv); // BOM for Excel UTF-8 compatibility
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ExportController = ExportController;
//# sourceMappingURL=export.controller.js.map