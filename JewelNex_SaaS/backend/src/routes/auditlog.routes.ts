import { Router } from 'express';
import { AuditLogController } from '../controllers/auditlog.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// GET /api/v1/audit-logs?entity=invoice&action=POST&page=1&limit=25
router.get('/', AuditLogController.list);

// POST /api/v1/audit-logs  (internal — log an event manually)
router.post('/', AuditLogController.create);

export default router;
