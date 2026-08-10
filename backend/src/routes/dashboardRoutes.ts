import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController';
import { authenticate } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';

const router = Router();

router.use(authenticate);

router.get('/stats', authorize(['Admin', 'Sales', 'Warehouse', 'Accounts']), DashboardController.getStats);

export default router;
