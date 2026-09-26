import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/me', authenticate, AuthController.getMe);
router.get('/demo-users', AuthController.getDemoUsers);
router.post('/wallet/topup', authenticate, AuthController.topupWallet);

export default router;
