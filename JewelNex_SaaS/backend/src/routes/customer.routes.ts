import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', CustomerController.createCustomer);
router.get('/search', CustomerController.searchCustomers);

export default router;
