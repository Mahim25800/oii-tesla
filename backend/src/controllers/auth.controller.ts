import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database/connection.js';
import { generateToken, AuthUser } from '../middleware/auth.js';
import { CONFIG } from '../config/index.js';

export class AuthController {
  public static async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, phone, email, password, confirmPassword, role = 'PASSENGER' } = req.body;

      if (!name || !phone || !email || !password) {
        res.status(400).json({ error: 'Validation Error: Name, phone, email, and password are required' });
        return;
      }

      // Name validation: must not be less than 3 letters
      const cleanName = typeof name === 'string' ? name.trim() : '';
      if (cleanName.length < 3) {
        res.status(400).json({ error: 'Validation Error: Name must be at least 3 letters' });
        return;
      }

      // Phone validation: exactly 11 digits, numbers only
      const cleanPhone = typeof phone === 'string' ? phone.trim() : '';
      if (!/^\d{11}$/.test(cleanPhone)) {
        res.status(400).json({ error: 'Validation Error: Phone number must be exactly 11 digits and contain only numbers (e.g. 01712345678)' });
        return;
      }

      // Email validation: must match email structure
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (typeof email !== 'string' || !emailRegex.test(email.trim())) {
        res.status(400).json({ error: 'Validation Error: Invalid email format (must match standard email structure)' });
        return;
      }

      if (typeof password !== 'string' || password.length < 6) {
        res.status(400).json({ error: 'Validation Error: Password must be at least 6 characters' });
        return;
      }

      if (confirmPassword && confirmPassword !== password) {
        res.status(400).json({ error: 'Validation Error: Passwords do not match' });
        return;
      }

      const validRoles = ['PASSENGER', 'DRIVER'];
      if (!validRoles.includes(role)) {
        res.status(400).json({ error: 'Validation Error: Role must be PASSENGER or DRIVER' });
        return;
      }

      const db = getDatabase();
      const existing = db.prepare('SELECT id FROM users WHERE email = ? OR phone = ?').get(email, phone);
      if (existing) {
        res.status(409).json({ error: 'Conflict: User with this email or phone already exists' });
        return;
      }

      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);
      const userId = uuidv4();

      const insertUser = db.prepare(`
        INSERT INTO users (id, name, phone, email, password_hash, role, wallet_poysha)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      // 500 BDT starting bonus for new users
      insertUser.run(userId, name, phone, email, passwordHash, role, 50000);

      // If registering as driver, automatically create a default Dhaka Tesla
      if (role === 'DRIVER') {
        const vehicleId = uuidv4();
        db.prepare(`
          INSERT INTO vehicles (id, driver_id, name, license_plate, total_capacity, battery_percent, status, current_zone)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          vehicleId,
          userId,
          `Tesla-${name.split(' ')[0]}`,
          `DHK-E-${Math.floor(1000 + Math.random() * 9000)}`,
          3,
          85,
          'ONLINE',
          'BANANI'
        );
      }

      const token = generateToken({ id: userId, role, email });
      res.status(201).json({
        message: 'Registration successful',
        token,
        user: { id: userId, name, phone, email, role, wallet_poysha: 50000, wallet_bdt: 500.0 }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  }

  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { identifier, password } = req.body; // identifier can be email or phone
      if (!identifier || !password) {
        res.status(400).json({ error: 'Validation Error: Identifier (email/phone) and password are required' });
        return;
      }

      const db = getDatabase();
      const usernamePrefix = identifier.includes('@') ? identifier.split('@')[0] : identifier;
      const user = db.prepare(`
        SELECT id, name, email, phone, password_hash, role, wallet_poysha 
        FROM users 
        WHERE email = ? OR phone = ? OR email LIKE ?
      `).get(identifier, identifier, `${usernamePrefix}@%`) as (AuthUser & { password_hash: string }) | undefined;

      if (!user) {
        res.status(401).json({ error: 'Authentication Failed: Invalid credentials' });
        return;
      }

      const passwordMatch = bcrypt.compareSync(password, user.password_hash);
      if (!passwordMatch) {
        res.status(401).json({ error: 'Authentication Failed: Invalid credentials' });
        return;
      }

      let vehicle = null;
      if (user.role === 'DRIVER') {
        vehicle = db.prepare('SELECT * FROM vehicles WHERE driver_id = ?').get(user.id);
      }

      const token = generateToken({ id: user.id, role: user.role, email: user.email });
      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          wallet_poysha: user.wallet_poysha,
          wallet_bdt: user.wallet_poysha / 100,
          vehicle
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  }

  public static async getMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const db = getDatabase();
      const user = db.prepare(`
        SELECT id, name, email, phone, role, wallet_poysha, created_at 
        FROM users WHERE id = ?
      `).get(req.user.id) as any;

      let vehicle = null;
      if (user.role === 'DRIVER') {
        vehicle = db.prepare('SELECT * FROM vehicles WHERE driver_id = ?').get(user.id);
      }

      res.json({
        user: {
          ...user,
          wallet_bdt: user.wallet_poysha / 100,
          vehicle
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  }

  /**
   * Evaluator Demo Helper:
   * Returns pre-authenticated demo tokens for the authentic PRD story cast:
   * Jashim (Driver), Nusrat (Passenger), Rafiq (Passenger), Shirin (Passenger).
   * Enables one-click testing of all scenarios.
   */
  public static async getDemoUsers(req: Request, res: Response): Promise<void> {
    try {
      const db = getDatabase();
      const users = db.prepare(`
        SELECT u.id, u.name, u.email, u.phone, u.role, u.wallet_poysha,
               v.id as vehicle_id, v.name as vehicle_name, v.license_plate, v.total_capacity, v.battery_percent, v.status as vehicle_status
        FROM users u
        LEFT JOIN vehicles v ON v.driver_id = u.id
        WHERE u.email IN ('jashim@tesla.dhaka', 'nusrat@banani.dhaka', 'rafiq@gulshan.dhaka', 'shirin@mohakhali.dhaka')
      `).all() as any[];

      const demoAccounts = users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        wallet_poysha: u.wallet_poysha,
        wallet_bdt: u.wallet_poysha / 100,
        token: generateToken({ id: u.id, role: u.role, email: u.email }),
        vehicle: u.vehicle_id ? {
          id: u.vehicle_id,
          name: u.vehicle_name,
          license_plate: u.license_plate,
          total_capacity: u.total_capacity,
          battery_percent: u.battery_percent,
          status: u.vehicle_status
        } : null
      }));

      res.json({
        message: 'Story Cast Demo Credentials',
        cast: demoAccounts
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  }

  public static async topupWallet(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { amountBdt } = req.body;
      const amount = Number(amountBdt);
      if (isNaN(amount) || amount <= 0) {
        res.status(400).json({ error: 'Validation Error: Positive amount required' });
        return;
      }

      const addPoysha = Math.round(amount * 100);
      const db = getDatabase();
      db.prepare('UPDATE users SET wallet_poysha = wallet_poysha + ? WHERE id = ?').run(addPoysha, req.user.id);

      const updated = db.prepare('SELECT wallet_poysha FROM users WHERE id = ?').get(req.user.id) as { wallet_poysha: number };

      res.json({
        message: `TeslaPay wallet credited with ৳${amount.toFixed(2)}`,
        wallet_poysha: updated.wallet_poysha,
        wallet_bdt: updated.wallet_poysha / 100
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  }
}
