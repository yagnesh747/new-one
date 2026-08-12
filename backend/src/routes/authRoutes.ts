import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/me', authenticateToken, authController.getMe);

export default router;
