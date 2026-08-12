import { Router } from 'express';
import * as challanController from '../controllers/challanController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = Router();

router.use(authenticateToken);

// View sales challans (Admin, Sales, Warehouse, Accounts)
router.get('/', authorizeRoles('Admin', 'Sales', 'Warehouse', 'Accounts'), challanController.getChallans);
router.get('/:id', authorizeRoles('Admin', 'Sales', 'Warehouse', 'Accounts'), challanController.getChallanById);

// Create / Edit draft challan (Admin, Sales)
router.post('/', authorizeRoles('Admin', 'Sales'), challanController.createChallan);
router.put('/:id', authorizeRoles('Admin', 'Sales'), challanController.updateDraftChallan);

// Confirm / Cancel challan (Admin, Sales, Accounts)
router.patch('/:id/confirm', authorizeRoles('Admin', 'Sales', 'Accounts'), challanController.confirmChallan);
router.patch('/:id/cancel', authorizeRoles('Admin', 'Sales', 'Accounts'), challanController.cancelChallan);

export default router;
