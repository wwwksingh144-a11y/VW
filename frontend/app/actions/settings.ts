'use server'

export async function getSettings() {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://vwapi.onrender.com';
    const response = await fetch(`${backendUrl}/api/settings`, {
      cache: 'no-store'
    });
    if (!response.ok) return {};
    return await response.json();
  } catch (err) {
    console.error('Failed to fetch settings:', err);
    return {};
  }
}
