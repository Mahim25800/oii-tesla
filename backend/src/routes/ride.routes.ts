import { Router } from 'express';
import { RideController } from '../controllers/ride.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/estimate', RideController.estimateFare);
router.post('/', authenticate, RideController.requestRide);
router.get('/my-history', authenticate, RideController.getMyHistory);
router.get('/:id', authenticate, RideController.getRide);
router.post('/:id/cancel', authenticate, RideController.cancelRide);

export default router;
