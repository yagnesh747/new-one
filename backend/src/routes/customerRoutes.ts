import { Router } from 'express';
import { CustomerController } from '../controllers/customerController';
import { authenticate } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';
import { validate } from '../middleware/validateMiddleware';
import {
  createCustomerSchema,
  updateCustomerSchema,
  addFollowUpSchema,
} from '../validators/customer.validator';

const router = Router();

router.use(authenticate);

router.get('/', authorize(['Admin', 'Sales', 'Accounts']), CustomerController.getCustomers);
router.get('/:id', authorize(['Admin', 'Sales', 'Accounts']), CustomerController.getCustomerById);
router.post('/', authorize(['Admin', 'Sales']), validate(createCustomerSchema), CustomerController.createCustomer);
router.put('/:id', authorize(['Admin', 'Sales']), validate(updateCustomerSchema), CustomerController.updateCustomer);
router.delete('/:id', authorize(['Admin']), CustomerController.deleteCustomer);

router.post(
  '/:id/followups',
  authorize(['Admin', 'Sales']),
  validate(addFollowUpSchema),
  CustomerController.addFollowUp
);
router.get('/:id/followups', authorize(['Admin', 'Sales', 'Accounts']), CustomerController.getFollowUps);

export default router;
