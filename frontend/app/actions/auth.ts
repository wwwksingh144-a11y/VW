'use server'

import { auth } from '@/lib/auth/server'
import { redirect } from 'next/navigation'
import { checkRateLimit, resetRateLimit } from '@/lib/auth/rate-limit'
import { logAdminAction } from '@/lib/auth/audit-log'

// Rate limit: 5 login attempts per 15 minutes per email
const LOGIN_RATE_LIMIT_MAX = 5;
const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

export async function authenticateWithTurnstile(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const turnstileToken = formData.get('cf-turnstile-response') as string
  const isSignUp = formData.get('isSignUp') === 'true'

  if (!email || !password || !turnstileToken) {
    return { error: "Missing required fields or human verification failed." }
  }

  // Rate limiting — keyed by email to prevent brute-force per account
  const rateLimitKey = `login:${email.toLowerCase()}`;
  const rateCheck = checkRateLimit(rateLimitKey, LOGIN_RATE_LIMIT_MAX, LOGIN_RATE_LIMIT_WINDOW_MS);

  if (!rateCheck.allowed) {
    const retryMinutes = Math.ceil(rateCheck.retryAfterMs / 60_000);
    return { error: `Too many login attempts. Please try again in ${retryMinutes} minute${retryMinutes > 1 ? 's' : ''}.` }
  }

  // 1. Verify Turnstile token
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY!,
      response: turnstileToken,
    }).toString()
  })
  
  const outcome = await res.json()
  if (!outcome.success) {
    return { error: "Security check failed. Please try again." }
  }

  // 2. Authenticate with Neon
  let result;
  try {
    if (isSignUp) {
      const name = email.split('@')[0] || 'User'
      result = await auth.signUp.email({ name, email, password })
    } else {
      result = await auth.signIn.email({ email, password })
    }

    if (result?.error) {
      return { error: result.error.message || "Authentication failed. Please check your credentials." }
    }
  } catch (err: any) {
    console.error("Auth action error:", err);
    return { error: "An unexpected authentication error occurred." }
  }

  // Clear rate limit on successful authentication
  resetRateLimit(rateLimitKey);

  logAdminAction(
    isSignUp ? "auth.signup" : "auth.login",
    email,
    email,
    { success: true }
  );

  // If this was a sign up, Neon Auth will send a verification OTP
  // We return a flag to tell the UI to show the OTP entry form
  if (isSignUp) {
    return { requireOtp: true, email }
  }

  // 3. Redirect on success
  redirect('/')
}

export async function verifySignupOtp(formData: FormData) {
  const email = formData.get('email') as string
  const otp = formData.get('otp') as string

  if (!email || !otp) {
    return { error: "Missing email or verification code." }
  }

  const result = await (auth as any).emailOtp.verifyEmail({ email, otp })

  if (result?.error) {
    return { error: result.error.message || "Invalid verification code. Please try again." }
  }

  // Verification successful, redirect to onboarding flow
  redirect('/onboarding')
}

export async function logoutUser() {
  try {
    await auth.signOut()
  } catch (err) {
    console.error("Logout error:", err);
  }
  redirect('/')
}
