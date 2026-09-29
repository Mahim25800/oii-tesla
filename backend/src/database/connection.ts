import { DatabaseSync } from 'node:sqlite';
import { CONFIG } from '../config/index.js';
import fs from 'fs';
import path from 'path';

export interface PreparedStatement {
  get(...params: any[]): any;
  all(...params: any[]): any[];
  run(...params: any[]): { changes: number | bigint; lastInsertRowid: number | bigint };
}

export interface DatabaseConnection {
  exec(sql: string): any;
  pragma(sql: string): any;
  prepare(sql: string): PreparedStatement;
  transaction<T extends (...args: any[]) => any>(fn: T): T;
  close(): void;
}

class NodeSqliteDatabase implements DatabaseConnection {
  private raw: DatabaseSync;

  constructor(filePath: string) {
    this.raw = new DatabaseSync(filePath);
  }

  exec(sql: string): any {
    return this.raw.exec(sql);
  }

  pragma(sql: string): any {
    return this.raw.exec(`PRAGMA ${sql};`);
  }

  prepare(sql: string): PreparedStatement {
    const stmt = this.raw.prepare(sql);
    return {
      get: (...params: any[]) => stmt.get(...params),
      all: (...params: any[]) => stmt.all(...params),
      run: (...params: any[]) => stmt.run(...params)
    };
  }

  transaction<T extends (...args: any[]) => any>(fn: T): T {
    return ((...args: any[]) => {
      this.raw.exec('BEGIN IMMEDIATE;');
      try {
        const result = fn(...args);
        this.raw.exec('COMMIT;');
        return result;
      } catch (err) {
        try {
          this.raw.exec('ROLLBACK;');
        } catch (_) {}
        throw err;
      }
    }) as T;
  }

  close(): void {
    try {
      this.raw.close();
    } catch (_) {}
  }
}

let dbInstance: DatabaseConnection | null = null;

export function getDatabase(dbPath?: string): DatabaseConnection {
  if (!dbInstance) {
    const file = dbPath || CONFIG.DB_FILE;
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    dbInstance = new NodeSqliteDatabase(file);

    // Enable SQLite WAL (Write-Ahead Logging) for superior concurrent read/write throughput
    dbInstance.pragma('journal_mode = WAL');
    // Enforce Foreign Key constraints unconditionally
    dbInstance.pragma('foreign_keys = ON');
    // Busy timeout of 5000ms to gracefully queue during bursts
    dbInstance.pragma('busy_timeout = 5000');

    initSchema(dbInstance);
  }
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

export function resetDatabase(dbPath?: string): DatabaseConnection {
  closeDatabase();
  const file = dbPath || CONFIG.DB_FILE;
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
  }
  return getDatabase(file);
}

export function initSchema(db: DatabaseConnection): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('PASSENGER', 'DRIVER', 'ADMIN')),
      wallet_poysha INTEGER NOT NULL DEFAULT 50000,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      driver_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      license_plate TEXT NOT NULL UNIQUE,
      total_capacity INTEGER NOT NULL DEFAULT 3 CHECK(total_capacity > 0),
      battery_percent INTEGER NOT NULL DEFAULT 84 CHECK(battery_percent >= 0 AND battery_percent <= 100),
      status TEXT NOT NULL DEFAULT 'ONLINE' CHECK(status IN ('ONLINE', 'OFFLINE', 'BUSY', 'CHARGING')),
      current_zone TEXT NOT NULL DEFAULT 'BANANI',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pools (
      id TEXT PRIMARY KEY,
      vehicle_id TEXT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
      driver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'FORMING' CHECK(status IN ('FORMING', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
      total_capacity INTEGER NOT NULL DEFAULT 3,
      occupied_seats INTEGER NOT NULL DEFAULT 0 CHECK(occupied_seats >= 0 AND occupied_seats <= total_capacity),
      current_zone TEXT NOT NULL,
      corridor_direction TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ride_requests (
      id TEXT PRIMARY KEY,
      passenger_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      pickup_zone TEXT NOT NULL,
      destination_zone TEXT NOT NULL,
      requested_seats INTEGER NOT NULL DEFAULT 1 CHECK(requested_seats > 0),
      status TEXT NOT NULL DEFAULT 'REQUESTED' CHECK(status IN ('REQUESTED', 'MATCHED', 'DRIVER_ARRIVED', 'STARTED', 'COMPLETED', 'CANCELLED')),
      pool_id TEXT REFERENCES pools(id) ON DELETE SET NULL,
      distance_km REAL NOT NULL,
      base_fare_poysha INTEGER NOT NULL,
      distance_fare_poysha INTEGER NOT NULL,
      discount_poysha INTEGER NOT NULL DEFAULT 0,
      final_fare_poysha INTEGER NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'TESLAPAY' CHECK(payment_method IN ('CASH', 'TESLAPAY')),
      payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK(payment_status IN ('PENDING', 'PAID', 'REFUNDED')),
      cancellation_reason TEXT,
      cancelled_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pool_memberships (
      id TEXT PRIMARY KEY,
      pool_id TEXT NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
      ride_request_id TEXT NOT NULL UNIQUE REFERENCES ride_requests(id) ON DELETE CASCADE,
      seats_allocated INTEGER NOT NULL CHECK(seats_allocated > 0),
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')),
      joined_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      actor_id TEXT,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_rides_passenger ON ride_requests(passenger_id, status);
    CREATE INDEX IF NOT EXISTS idx_rides_pool ON ride_requests(pool_id);
    CREATE INDEX IF NOT EXISTS idx_pools_driver ON pools(driver_id, status);
    CREATE INDEX IF NOT EXISTS idx_memberships_pool ON pool_memberships(pool_id, status);
    CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
  `);
}
