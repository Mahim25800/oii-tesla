import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import rideRoutes from './routes/ride.routes.js';
import driverRoutes from './routes/driver.routes.js';
import { DHAKA_ZONES } from './config/zones.js';

export function createApp(): express.Application {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'UP',
      service: 'Dhaka Tesla Pool API',
      timestamp: new Date().toISOString(),
      zonesCount: Object.keys(DHAKA_ZONES).length
    });
  });

  // Zones list endpoint
  app.get('/api/zones', (req, res) => {
    res.json({
      zones: Object.values(DHAKA_ZONES)
    });
  });

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/rides', rideRoutes);
  app.use('/api/driver', driverRoutes);

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled API Error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error'
    });
  });

  return app;
}
