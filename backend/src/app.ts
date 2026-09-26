import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
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

  return app;
}
