import { Router } from 'express';
import { LocationController } from '../controllers/location.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, authorize('admin'), LocationController.createLocation);
router.get('/', authenticate, LocationController.getLocations);
router.put('/:id', authenticate, authorize('admin'), LocationController.updateLocation);
router.delete('/:id', authenticate, authorize('admin'), LocationController.deleteLocation);

export default router;
