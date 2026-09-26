import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const CONFIG = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'dhaka-tesla-secret-key-2026-jashim-bullet',
  DB_FILE: process.env.DB_FILE || path.resolve(process.cwd(), 'dhaka_tesla.sqlite'),
  
  // Fare Engine Constants (All stored and computed in integer Poysha: 1 BDT = 100 Poysha)
  FARE: {
    BASE_FARE_POYSHA: 3000,          // 30.00 BDT Base Flag-drop fee
    RATE_PER_KM_POYSHA: 1500,        // 15.00 BDT per Km
    POOL_DISCOUNT_PERCENT: 25,       // 25% discount when matched in a pool
    MINIMUM_FARE_POYSHA: 2500,       // 25.00 BDT Minimum fare
  },

  // Vehicle Specifications (Dhaka Tesla / "Bullet")
  TESLA_BULLET: {
    NAME: 'Bullet',
    REGISTRATION: 'DHK-METRO-E-11-2026',
    TOTAL_SEATS: 3,                  // Maximum 3 passenger seats
    BATTERY_PERCENT: 84,             // 84% starting charge
    MAX_RANGE_KM: 65,
    TOP_SPEED_KMPH: 45
  },

  // Seed User Test Credentials
  SEED_CREDENTIALS: {
    DEFAULT_PASSWORD: 'password123'
  }
};
