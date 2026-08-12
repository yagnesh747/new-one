import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = Router();

router.use(authenticateToken);
router.get('/stats', authorizeRoles('Admin', 'Sales', 'Warehouse', 'Accounts'), dashboardController.getStats);
router.get('/summary', authorizeRoles('Admin', 'Sales', 'Warehouse', 'Accounts'), dashboardController.getSummary);
router.get('/low-stock', authorizeRoles('Admin', 'Sales', 'Warehouse', 'Accounts'), dashboardController.getLowStock);
router.get('/recent-activity', authorizeRoles('Admin', 'Sales', 'Warehouse', 'Accounts'), dashboardController.getRecentActivity);
router.get('/sales-summary', authorizeRoles('Admin', 'Sales', 'Warehouse', 'Accounts'), dashboardController.getSalesSummary);
router.get('/top-customers', authorizeRoles('Admin', 'Sales', 'Warehouse', 'Accounts'), dashboardController.getTopCustomers);

export default router;
