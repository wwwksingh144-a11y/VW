import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { adminRoles } from '../db/schema';
import { eq } from 'drizzle-orm';
import * as jose from 'jose';

// Use a stable secret from env or generate one
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'fallback-secret-for-admin-session-please-change';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface AdminPayload {
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      admin?: AdminPayload;
    }
  }
}

export const adminAuthMiddleware = (requiredRoles?: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
      }

      const token = authHeader.split(' ')[1];
      let payload: jose.JWTPayload;
      try {
        const { payload: jwtPayload } = await jose.jwtVerify(token, secretKey);
        payload = jwtPayload;
      } catch (e) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
      }

      const email = payload.email as string;

      // Check Super Admin
      if (email === process.env.SUPER_ADMIN_EMAIL) {
        req.admin = { email: email, role: 'Developer' };
        return next();
      }

      // Look up role in db
      const [adminRecord] = await db.select().from(adminRoles).where(eq(adminRoles.email, email));
      if (!adminRecord) {
        return res.status(403).json({ error: 'Forbidden: Admin role revoked' });
      }

      req.admin = { email: adminRecord.email, role: adminRecord.role };

      if (requiredRoles && requiredRoles.length > 0) {
        if (!requiredRoles.includes(req.admin.role)) {
          return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }
      }

      next();
    } catch (error) {
      console.error('RBAC Middleware Error:', error);
      res.status(500).json({ error: 'Internal server error during auth check' });
    }
  };
};
