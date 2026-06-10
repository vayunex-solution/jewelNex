"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invoice_controller_1 = require("../controllers/invoice.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post('/', invoice_controller_1.InvoiceController.createInvoice);
router.get('/', invoice_controller_1.InvoiceController.listPostedInvoices);
router.get('/:id', invoice_controller_1.InvoiceController.getInvoiceById);
router.get('/:id/pdf', invoice_controller_1.InvoiceController.downloadInvoicePDF);
router.post('/:id/reverse', invoice_controller_1.InvoiceController.reverseInvoice);
// Draft endpoints
router.get('/drafts', invoice_controller_1.InvoiceController.listDrafts);
router.post('/draft', invoice_controller_1.InvoiceController.saveDraft);
router.put('/draft/:id', invoice_controller_1.InvoiceController.editDraft);
router.post('/draft/:id/post', invoice_controller_1.InvoiceController.postDraft);
exports.default = router;
//# sourceMappingURL=invoice.routes.js.map