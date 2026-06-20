import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', InvoiceController.createInvoice);
router.get('/', InvoiceController.listPostedInvoices);
router.get('/:id', InvoiceController.getInvoiceById);
router.get('/:id/pdf', InvoiceController.downloadInvoicePDF);
router.post('/:id/reverse', authorize('admin', 'manager'), InvoiceController.reverseInvoice);

// Draft endpoints
router.get('/drafts', InvoiceController.listDrafts);
router.post('/draft', InvoiceController.saveDraft);
router.put('/draft/:id', InvoiceController.editDraft);
router.post('/draft/:id/post', InvoiceController.postDraft);

export default router;
