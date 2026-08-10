import { Router } from 'express';
import { StockController } from '../controllers/stockController';
import { authenticate } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', authorize(['Admin', 'Warehouse', 'Sales', 'Accounts']), StockController.getStockMovements);

export default router;
