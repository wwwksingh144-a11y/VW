import { auth } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import { checkRateLimit } from '@/lib/auth/rate-limit';
import { cookies } from 'next/headers';
import * as jose from 'jose';

// Rate limit: 30 admin requests per minute per user
const ADMIN_RATE_LIMIT_MAX = 30;
const ADMIN_RATE_LIMIT_WINDOW_MS = 60_000;

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'fallback-secret-for-admin-session-please-change';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface AdminUser {
  email: string;
  role: string;
  name: string;
  originalUser: any;
}

/**
 * Require that the current request is made by an authenticated admin user.
 * It checks the primary web session AND the secondary admin session.
 * 
 * @param requiredRoles - Array of allowed roles (e.g., ['Admin', 'SEO']). 'Developer' always has access.
 */
export async function requireAdmin(requiredRoles?: string[]): Promise<AdminUser> {
  try {
    const sessionRes = await auth.getSession();

    if (!sessionRes?.data?.user) {
      redirect('/login');
    }

    const user = sessionRes.data.user;
    const userEmail = (user.email ?? '').toLowerCase();

    // Secondary Admin Session check
    const cookieStore = await cookies();
    const adminToken = cookieStore.get('admin_session')?.value;

    if (!adminToken) {
      redirect('/admin-login');
    }

    let adminPayload: jose.JWTPayload;
    try {
      const { payload } = await jose.jwtVerify(adminToken, secretKey);
      adminPayload = payload;
    } catch (e) {
      console.warn(`Invalid admin session for ${userEmail}`);
      redirect('/admin-login');
    }

    // Check for mismatch (Strict Enforcement)
    if (adminPayload.email !== userEmail) {
      console.warn(`Mismatch in admin session and primary session for ${userEmail}`);
      redirect('/admin-login');
    }

    const role = adminPayload.role as string;
    const name = adminPayload.name as string;

    // Check Roles
    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(role) && role !== 'Developer') {
        redirect('/admin'); // Redirect back to dashboard if not allowed
      }
    }

    // Rate limiting per user
    const rateLimitKey = `admin:${user.id || userEmail}`;
    const result = checkRateLimit(rateLimitKey, ADMIN_RATE_LIMIT_MAX, ADMIN_RATE_LIMIT_WINDOW_MS);

    if (!result.allowed) {
      redirect('/login');
    }

    return {
      email: adminPayload.email as string,
      role,
      name,
      originalUser: user
    };
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_REDIRECT') || err?.message === 'NEXT_REDIRECT') {
      throw err;
    }
    console.error('requireAdmin authentication check failed:', err);
    redirect('/login');
  }
}
