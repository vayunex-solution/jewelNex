import { Router } from 'express';
import { AccountingController } from '../controllers/accounting.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/initialize', authorize('admin', 'manager'), AccountingController.initializeCOA);
router.get('/groups', AccountingController.getGroups);
router.get('/heads', AccountingController.getHeads);
router.get('/ledger/:accountId', authorize('admin', 'manager'), AccountingController.getLedger);
router.get('/customer/:customerId/balance', AccountingController.getCustomerBalance);

const authReport = authorize('admin', 'manager');
router.get('/reports/daybook', authReport, AccountingController.getDayBookReport);
router.get('/reports/ledger/:accountId', authReport, AccountingController.getGeneralLedgerReport);
router.get('/reports/cashbook', authReport, AccountingController.getCashBookReport);
router.get('/reports/bankbook', authReport, AccountingController.getBankBookReport);
router.get('/reports/trial-balance', authReport, AccountingController.getTrialBalanceReport);
router.get('/reports/profit-loss', authReport, AccountingController.getProfitLossReport);
router.get('/reports/balance-sheet', authReport, AccountingController.getBalanceSheetReport);

export default router;
