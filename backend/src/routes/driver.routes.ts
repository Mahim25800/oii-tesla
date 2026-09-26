import { Router } from 'express';
import { DriverController } from '../controllers/driver.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Driver routes require authenticated DRIVER role
router.use(authenticate);
router.use(requireRole('DRIVER'));

router.get('/active-pool', DriverController.getActivePool);
router.get('/pending-requests', DriverController.getPendingRequests);
router.post('/rides/:id/accept', DriverController.acceptRide);
router.post('/rides/:id/arrived', DriverController.markArrived);
router.post('/rides/:id/start', DriverController.startTrip);
router.post('/rides/:id/complete', DriverController.completeTrip);
router.get('/history', DriverController.getHistory);
router.post('/vehicle/status', DriverController.setVehicleStatus);

export default router;
