import { Router } from 'express';
import { ChallanController } from '../controllers/challanController';
import { authenticate } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';
import { validate } from '../middleware/validateMiddleware';
import { createChallanSchema } from '../validators/challan.validator';

const router = Router();

router.use(authenticate);

router.get('/', authorize(['Admin', 'Sales', 'Warehouse', 'Accounts']), ChallanController.getChallans);
router.get('/:id', authorize(['Admin', 'Sales', 'Warehouse', 'Accounts']), ChallanController.getChallanById);
router.post('/', authorize(['Admin', 'Sales']), validate(createChallanSchema), ChallanController.createChallan);
router.post('/:id/confirm', authorize(['Admin', 'Sales', 'Warehouse']), ChallanController.confirmChallan);
router.post('/:id/cancel', authorize(['Admin', 'Sales']), ChallanController.cancelChallan);

export default router;
