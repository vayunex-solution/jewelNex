import { Router } from 'express';
import { ExportController } from '../controllers/export.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// GET /api/v1/export/trial-balance.xlsx?date=2026-06-01
router.get('/trial-balance.xlsx', ExportController.trialBalanceXLSX);

// GET /api/v1/export/daybook.xlsx?start=2026-04-01&end=2026-06-30
router.get('/daybook.xlsx', ExportController.dayBookXLSX);

// GET /api/v1/export/ledger/:accountId.xlsx?start=...&end=...
router.get('/ledger/:accountId.xlsx', ExportController.generalLedgerXLSX);

// GET /api/v1/export/invoices.csv?start=2026-04-01&end=2026-06-30
router.get('/invoices.csv', ExportController.invoiceRegisterCSV);

export default router;
