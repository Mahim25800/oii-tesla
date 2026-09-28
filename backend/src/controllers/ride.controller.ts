import { Request, Response } from 'express';
import { PoolingService, InvalidStateTransitionError, UnauthorizedRideAccessError } from '../services/PoolingService.js';
import { FareEngine } from '../services/FareEngine.js';

export class RideController {
  public static async estimateFare(req: Request, res: Response): Promise<void> {
    try {
      const { pickupZone, destinationZone, requestedSeats = 1 } = req.body;
      if (!pickupZone || !destinationZone) {
        res.status(400).json({ error: 'Pickup zone and destination zone are required' });
        return;
      }

      const solo = FareEngine.calculateFare({
        pickupZoneId: pickupZone,
        destinationZoneId: destinationZone,
        requestedSeats: Number(requestedSeats),
        isPooled: false
      });

      const pooled = FareEngine.calculateFare({
        pickupZoneId: pickupZone,
        destinationZoneId: destinationZone,
        requestedSeats: Number(requestedSeats),
        isPooled: true
      });

      res.json({
        distanceKm: solo.distanceKm,
        soloFare: solo,
        pooledFare: pooled,
        potentialSavingsBdt: (solo.finalFarePoysha - pooled.finalFarePoysha) / 100
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Error estimating fare' });
    }
  }

  public static async requestRide(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { pickupZone, destinationZone, requestedSeats = 1, paymentMethod = 'TESLAPAY' } = req.body;
      if (!pickupZone || !destinationZone) {
        res.status(400).json({ error: 'Pickup and destination zones are required' });
        return;
      }

      const ride = PoolingService.createRideRequest({
        passengerId: req.user.id,
        pickupZone,
        destinationZone,
        requestedSeats: Number(requestedSeats),
        paymentMethod
      });

      res.status(201).json({
        message: ride.status === 'MATCHED'
          ? 'Ride matched with Dhaka Tesla Pool!'
          : 'Ride requested. Searching for available Dhaka Tesla...',
        ride
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to request ride' });
    }
  }

  public static async getRide(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const ride = PoolingService.getRideById(req.params.id as string);
      if (!ride) {
        res.status(404).json({ error: 'Ride request not found' });
        return;
      }

      // Security Check: Users can only see their own rides, unless they are the assigned driver
      if (req.user.role === 'PASSENGER' && ride.passenger_id !== req.user.id) {
        res.status(403).json({ error: 'Forbidden: You cannot access another passenger\'s ride details' });
        return;
      }

      res.json({ ride });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  public static async getMyHistory(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const rides = PoolingService.getPassengerRides(req.user.id);
      res.json({ rides });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  public static async cancelRide(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { reason } = req.body;
      const cancelledRide = PoolingService.cancelRide(req.user.id, req.params.id as string, reason);
      res.json({
        message: 'Ride request cancelled successfully',
        ride: cancelledRide
      });
    } catch (err: any) {
      if (err instanceof UnauthorizedRideAccessError) {
        res.status(403).json({ error: err.message });
      } else if (err instanceof InvalidStateTransitionError) {
        res.status(409).json({ error: err.message });
      } else {
        res.status(400).json({ error: err.message });
      }
    }
  }
}
