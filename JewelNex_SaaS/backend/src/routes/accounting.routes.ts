import { Router } from 'express';
import { AccountingController } from '../controllers/accounting.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/initialize', AccountingController.initializeCOA);
router.get('/groups', AccountingController.getGroups);
router.get('/heads', AccountingController.getHeads);
router.get('/ledger/:accountId', AccountingController.getLedger);
router.get('/customer/:customerId/balance', AccountingController.getCustomerBalance);

router.get('/reports/daybook', AccountingController.getDayBookReport);
router.get('/reports/ledger/:accountId', AccountingController.getGeneralLedgerReport);
router.get('/reports/cashbook', AccountingController.getCashBookReport);
router.get('/reports/bankbook', AccountingController.getBankBookReport);
router.get('/reports/trial-balance', AccountingController.getTrialBalanceReport);
router.get('/reports/profit-loss', AccountingController.getProfitLossReport);
router.get('/reports/balance-sheet', AccountingController.getBalanceSheetReport);

export default router;
