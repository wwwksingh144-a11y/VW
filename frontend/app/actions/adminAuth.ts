'use server'

import { cookies } from 'next/headers';
import { auth } from '@/lib/auth/server';

export async function loginAdmin(password: string) {
  try {
    const sessionRes = await auth.getSession();
    if (!sessionRes?.data?.user) {
      return { error: 'Not authenticated on main site. Please log in to the main site first.' };
    }

    const email = sessionRes.data.user.email;
    
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const response = await fetch(`${backendUrl}/api/admin/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store'
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Failed to authenticate admin' };
    }

    const cookieStore = await cookies();
    cookieStore.set('admin_session', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 12 * 60 * 60 // 12 hours
    });

    return { success: true };
  } catch (error: any) {
    console.error('Admin login error:', error);
    return { error: 'An unexpected error occurred while communicating with the server.' };
  }
}
