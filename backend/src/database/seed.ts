import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase, initSchema } from './connection.js';
import { CONFIG } from '../config/index.js';

export interface SeedDataResult {
  driver: { id: string; name: string; email: string; phone: string; role: string };
  vehicle: { id: string; name: string; license_plate: string; total_capacity: number; battery_percent: number };
  passengers: {
    nusrat: { id: string; name: string; email: string; phone: string; wallet_poysha: number };
    rafiq: { id: string; name: string; email: string; phone: string; wallet_poysha: number };
    shirin: { id: string; name: string; email: string; phone: string; wallet_poysha: number };
  };
}

export function runSeed(customDbPath?: string): SeedDataResult {
  const db = getDatabase(customDbPath);
  initSchema(db);

  // Clear existing records to ensure clean reproducible demo
  db.exec(`
    DELETE FROM audit_logs;
    DELETE FROM pool_memberships;
    DELETE FROM ride_requests;
    DELETE FROM pools;
    DELETE FROM vehicles;
    DELETE FROM users;
  `);

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(CONFIG.SEED_CREDENTIALS.DEFAULT_PASSWORD, salt);

  // 1. Driver Jashim
  const jashimId = uuidv4();
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, phone, email, password_hash, role, wallet_poysha)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(jashimId, 'Jashim Uddin', '+8801711000001', 'jashim@tesla.dhaka', passwordHash, 'DRIVER', 150000);

  // 2. Vehicle "Bullet"
  const vehicleId = uuidv4();
  const insertVehicle = db.prepare(`
    INSERT INTO vehicles (id, driver_id, name, license_plate, total_capacity, battery_percent, status, current_zone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertVehicle.run(
    vehicleId,
    jashimId,
    CONFIG.TESLA_BULLET.NAME,
    CONFIG.TESLA_BULLET.REGISTRATION,
    CONFIG.TESLA_BULLET.TOTAL_SEATS,
    CONFIG.TESLA_BULLET.BATTERY_PERCENT,
    'ONLINE',
    'BANANI'
  );

  // 3. Passengers: Nusrat, Rafiq, Shirin
  const nusratId = uuidv4();
  insertUser.run(nusratId, 'Nusrat Jahan', '+8801711000002', 'nusrat@banani.dhaka', passwordHash, 'PASSENGER', 80000); // 800 BDT

  const rafiqId = uuidv4();
  insertUser.run(rafiqId, 'Rafiq Ahmed', '+8801711000003', 'rafiq@gulshan.dhaka', passwordHash, 'PASSENGER', 65000); // 650 BDT

  const shirinId = uuidv4();
  insertUser.run(shirinId, 'Shirin Akter', '+8801711000004', 'shirin@mohakhali.dhaka', passwordHash, 'PASSENGER', 50000); // 500 BDT

  // Log seed audit
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (id, entity_type, entity_id, action, actor_id, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertAudit.run(uuidv4(), 'SYSTEM', 'SEED', 'DATABASE_INITIALIZED', jashimId, JSON.stringify({
    message: 'Seeded Banani rush-hour cast: Jashim (Bullet), Nusrat, Rafiq, Shirin',
    timestamp: new Date().toISOString()
  }));

  console.log('Dhaka Tesla Pool seed data deployed successfully!');
  console.log('Driver: Jashim Uddin (Vehicle: Bullet, Capacity: 3 seats, Battery: 84%)');
  console.log('Passengers: Nusrat Jahan, Rafiq Ahmed, Shirin Akter');

  return {
    driver: { id: jashimId, name: 'Jashim Uddin', email: 'jashim@tesla.dhaka', phone: '+8801711000001', role: 'DRIVER' },
    vehicle: { id: vehicleId, name: CONFIG.TESLA_BULLET.NAME, license_plate: CONFIG.TESLA_BULLET.REGISTRATION, total_capacity: 3, battery_percent: 84 },
    passengers: {
      nusrat: { id: nusratId, name: 'Nusrat Jahan', email: 'nusrat@banani.dhaka', phone: '+8801711000002', wallet_poysha: 80000 },
      rafiq: { id: rafiqId, name: 'Rafiq Ahmed', email: 'rafiq@gulshan.dhaka', phone: '+8801711000003', wallet_poysha: 65000 },
      shirin: { id: shirinId, name: 'Shirin Akter', email: 'shirin@mohakhali.dhaka', phone: '+8801711000004', wallet_poysha: 50000 }
    }
  };
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  runSeed();
}
