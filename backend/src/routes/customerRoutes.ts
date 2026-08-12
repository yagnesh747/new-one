import { Router } from 'express';
import * as customerController from '../controllers/customerController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = Router();

router.use(authenticateToken);

// View customers (Admin, Sales, Accounts)
router.get('/', authorizeRoles('Admin', 'Sales', 'Accounts'), customerController.getCustomers);
router.get('/:id', authorizeRoles('Admin', 'Sales', 'Accounts'), customerController.getCustomerById);
router.get('/:id/followups', authorizeRoles('Admin', 'Sales', 'Accounts'), customerController.getCustomerFollowups);

// Manage customers (Admin, Sales)
router.post('/', authorizeRoles('Admin', 'Sales'), customerController.createCustomer);
router.put('/:id', authorizeRoles('Admin', 'Sales'), customerController.updateCustomer);
router.post('/:id/followups', authorizeRoles('Admin', 'Sales'), customerController.addCustomerFollowup);

// Delete customer (Admin only)
router.delete('/:id', authorizeRoles('Admin'), customerController.deleteCustomer);

export default router;
