import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { StockController } from '../controllers/stockController';
import { authenticate } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';
import { validate } from '../middleware/validateMiddleware';
import {
  createProductSchema,
  updateProductSchema,
  stockAdjustmentSchema,
} from '../validators/product.validator';

const router = Router();

router.use(authenticate);

router.get('/', authorize(['Admin', 'Sales', 'Warehouse', 'Accounts']), ProductController.getProducts);
router.get('/:id', authorize(['Admin', 'Sales', 'Warehouse', 'Accounts']), ProductController.getProductById);
router.post('/', authorize(['Admin', 'Warehouse']), validate(createProductSchema), ProductController.createProduct);
router.put('/:id', authorize(['Admin', 'Warehouse']), validate(updateProductSchema), ProductController.updateProduct);

router.post(
  '/:id/stock-movement',
  authorize(['Admin', 'Warehouse']),
  validate(stockAdjustmentSchema),
  StockController.addStockMovement
);
router.get('/:id/stock-movements', authorize(['Admin', 'Warehouse', 'Sales', 'Accounts']), StockController.getStockMovements);

export default router;
