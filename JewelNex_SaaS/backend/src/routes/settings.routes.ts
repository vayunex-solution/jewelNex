import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// GET /api/v1/settings/company
router.get('/company', SettingsController.getSettings);

// PUT /api/v1/settings/company
router.put('/company', authorize('admin'), SettingsController.updateSettings);

export default router;
