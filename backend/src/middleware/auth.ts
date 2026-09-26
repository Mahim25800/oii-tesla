import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CONFIG } from '../config/index.js';
import { getDatabase } from '../database/connection.js';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'PASSENGER' | 'DRIVER' | 'ADMIN';
  wallet_poysha: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function generateToken(user: { id: string; role: string; email: string }): string {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    CONFIG.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or malformed authorization token' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as { id: string; role: string; email: string };
    const db = getDatabase();
    const user = db.prepare('SELECT id, name, email, phone, role, wallet_poysha FROM users WHERE id = ?').get(decoded.id) as AuthUser | undefined;

    if (!user) {
      res.status(401).json({ error: 'Unauthorized: User not found or session expired' });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden: Resource requires one of roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`
      });
      return;
    }

    next();
  };
}
