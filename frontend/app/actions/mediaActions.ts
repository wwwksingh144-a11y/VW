'use server'

import { cookies } from 'next/headers';
import { auth } from '@/lib/auth/server';

const getBackendUrl = () => process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function getAdminMedia(type: 'photos' | 'videos') {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;
    if (!token) return { error: 'Unauthorized' };
    
    const response = await fetch(`${getBackendUrl()}/api/admin/media/${type}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });
    
    if (!response.ok) return { error: 'Failed to fetch media' };
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { error: 'Unexpected error' };
  }
}

export async function updateMedia(type: 'photos' | 'videos', id: string, data: any) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;
    
    if (!token) return { error: 'Unauthorized' };

    const response = await fetch(`${getBackendUrl()}/api/admin/media/${type}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    const resData = await response.json();
    if (!response.ok) return { error: resData.error || 'Failed to update media' };
    return { success: true, data: resData };
  } catch (error) {
    return { error: 'An unexpected error occurred.' };
  }
}

export async function softDeleteMedia(type: 'photos' | 'videos', id: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;
    
    if (!token) return { error: 'Unauthorized' };

    const response = await fetch(`${getBackendUrl()}/api/admin/media/${type}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const resData = await response.json();
    if (!response.ok) return { error: resData.error || 'Failed to delete media' };
    return { success: true };
  } catch (error) {
    return { error: 'An unexpected error occurred.' };
  }
}
