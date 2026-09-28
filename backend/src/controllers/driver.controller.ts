import { Request, Response } from 'express';
import { PoolingService, CapacityExceededError, InvalidStateTransitionError, UnauthorizedRideAccessError } from '../services/PoolingService.js';
import { getDatabase } from '../database/connection.js';

export class DriverController {
  public static async getActivePool(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const active = PoolingService.getDriverActivePool(req.user.id);
      res.json({ activePool: active });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  public static async getPendingRequests(req: Request, res: Response): Promise<void> {
    try {
      const pending = PoolingService.getPendingRideRequests();
      res.json({ pendingRequests: pending });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  public static async acceptRide(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const updatedRide = PoolingService.driverAcceptRide(req.user.id, req.params.id as string);
      res.json({
        message: 'Ride accepted into Dhaka Tesla Pool',
        ride: updatedRide
      });
    } catch (err: any) {
      if (err instanceof CapacityExceededError) {
        res.status(409).json({ error: err.message, code: 'CAPACITY_EXCEEDED' });
      } else if (err instanceof InvalidStateTransitionError) {
        res.status(409).json({ error: err.message, code: 'INVALID_TRANSITION' });
      } else {
        res.status(400).json({ error: err.message });
      }
    }
  }

  public static async markArrived(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const ride = PoolingService.markDriverArrived(req.user.id, req.params.id as string);
      res.json({
        message: 'Driver arrival confirmed',
        ride
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

  public static async startTrip(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const ride = PoolingService.startTrip(req.user.id, req.params.id as string);
      res.json({
        message: 'Trip started. Tesla Bullet rolling!',
        ride
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

  public static async completeTrip(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const ride = PoolingService.completeTrip(req.user.id, req.params.id as string);
      res.json({
        message: 'Trip completed. Fare settled.',
        ride
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

  public static async getHistory(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const history = PoolingService.getDriverHistory(req.user.id);
      res.json({
        history: history.map(h => ({
          ...h,
          total_earnings_bdt: (h.total_earnings_poysha || 0) / 100
        }))
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  public static async setVehicleStatus(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { status } = req.body;
      if (!['ONLINE', 'OFFLINE', 'CHARGING'].includes(status)) {
        res.status(400).json({ error: 'Status must be ONLINE, OFFLINE, or CHARGING' });
        return;
      }

      const db = getDatabase();
      db.prepare('UPDATE vehicles SET status = ? WHERE driver_id = ?').run(status, req.user.id);

      const vehicle = db.prepare('SELECT * FROM vehicles WHERE driver_id = ?').get(req.user.id);
      res.json({ message: `Vehicle status changed to ${status}`, vehicle });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
