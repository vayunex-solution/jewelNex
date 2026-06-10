"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const export_controller_1 = require("../controllers/export.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// GET /api/v1/export/trial-balance.xlsx?date=2026-06-01
router.get('/trial-balance.xlsx', export_controller_1.ExportController.trialBalanceXLSX);
// GET /api/v1/export/daybook.xlsx?start=2026-04-01&end=2026-06-30
router.get('/daybook.xlsx', export_controller_1.ExportController.dayBookXLSX);
// GET /api/v1/export/ledger/:accountId.xlsx?start=...&end=...
router.get('/ledger/:accountId.xlsx', export_controller_1.ExportController.generalLedgerXLSX);
// GET /api/v1/export/invoices.csv?start=2026-04-01&end=2026-06-30
router.get('/invoices.csv', export_controller_1.ExportController.invoiceRegisterCSV);
exports.default = router;
//# sourceMappingURL=export.routes.js.map