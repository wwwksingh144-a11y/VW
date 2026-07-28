'use server'

import { cookies } from 'next/headers';

const getBackendUrl = () => process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function initiatePromotion(name: string, email: string, role: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;
    
    if (!token) return { error: 'Unauthorized' };

    const response = await fetch(`${getBackendUrl()}/api/admin/initiate-promotion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ name, email, role })
    });

    const data = await response.json();
    if (!response.ok) return { error: data.error || 'Failed to initiate promotion' };
    return { success: true };
  } catch (error) {
    return { error: 'An unexpected error occurred.' };
  }
}

export async function verifyPromotion(email: string, superAdminOtp: string, promotedOtp: string, password: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;
    
    if (!token) return { error: 'Unauthorized' };

    const response = await fetch(`${getBackendUrl()}/api/admin/verify-promotion`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ email, superAdminOtp, promotedOtp, password })
    });

    const data = await response.json();
    if (!response.ok) return { error: data.error || 'Failed to verify promotion' };
    return { success: true };
  } catch (error) {
    return { error: 'An unexpected error occurred.' };
  }
}
