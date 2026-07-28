'use server'

import { auth } from '@/lib/auth/server'

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://vwapi.onrender.com';

export async function saveOnboardingProfile(formData: FormData) {
  // 1. Check if user is authenticated
  const { data: sessionData } = await auth.getSession();
  if (!sessionData?.user) {
    return { error: "You must be logged in to complete onboarding." };
  }

  const userId = sessionData.user.id; // or email, but id is safer

  // 2. Extract data from formData
  const type = formData.get('type') as 'individual' | 'company';
  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;
  const source = formData.get('source') as string;

  // Address fields
  const country = formData.get('country') as string;
  const state = formData.get('state') as string;
  const city = formData.get('city') as string;
  const pincode = formData.get('pincode') as string;
  const fullAddress = formData.get('fullAddress') as string; // For company
  
  const address = type === 'individual' 
    ? { country, state, city, pincode } 
    : { fullAddress };

  // Company specific fields
  const companyName = formData.get('companyName') as string;
  const employeesCount = formData.get('employeesCount') as string;

  // Interests
  const interestsStr = formData.get('interests') as string;
  let interests: string[] = [];
  try {
    interests = interestsStr ? JSON.parse(interestsStr) : [];
  } catch (e) {
    // Ignore parse error
  }

  // 3. Save to backend database
  try {
    const bodyPayload = {
      userId,
      type,
      name,
      phone,
      address,
      companyName: type === 'company' ? companyName : null,
      employeesCount: type === 'company' ? employeesCount : null,
      interests,
      source,
    };

    const res = await fetch(`${API_URL}/api/user-profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyPayload)
    });

    if (!res.ok) {
        throw new Error('Failed to save profile on backend');
    }
  } catch (error: any) {
    console.error("Failed to save onboarding profile:", error);
    return { error: "An error occurred while saving your profile." };
  }

  // 4. Return success so the UI can redirect
  return { success: true };
}
