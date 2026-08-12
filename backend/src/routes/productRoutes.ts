import { Router } from 'express';
import * as productController from '../controllers/productController';
import { authenticateToken } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';

const router = Router();

router.use(authenticateToken);

// View products (All authenticated roles)
router.get('/', authorizeRoles('Admin', 'Sales', 'Warehouse', 'Accounts'), productController.getProducts);
router.get('/stock-movements', authorizeRoles('Admin', 'Sales', 'Warehouse', 'Accounts'), productController.getStockMovements);
router.get('/:id', authorizeRoles('Admin', 'Sales', 'Warehouse', 'Accounts'), productController.getProductById);

// Manage products & stock movements (Admin, Warehouse)
router.post('/', authorizeRoles('Admin', 'Warehouse'), productController.createProduct);
router.put('/:id', authorizeRoles('Admin', 'Warehouse'), productController.updateProduct);
router.post('/stock-movements', authorizeRoles('Admin', 'Warehouse'), productController.addStockMovement);

export default router;
