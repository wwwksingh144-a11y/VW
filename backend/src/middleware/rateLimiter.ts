import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { Request, Response, NextFunction } from 'express';

// Initialize Redis client using the existing Upstash URL/Token from process.env
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// 1. Auth routes tier (e.g. login, signup): 5 requests per minute per IP
export const authRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: '@upstash/ratelimit/auth',
});

// 2. Public endpoints tier: 30 requests per minute per IP
export const publicRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 m'),
  analytics: true,
  prefix: '@upstash/ratelimit/public',
});

// 3. Authenticated actions tier: 100 requests per minute per User ID
export const authUserRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: '@upstash/ratelimit/user',
});

// Middleware generators
export const authRateLimitMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const { success, limit, remaining, reset } = await authRateLimiter.limit(ip);
  
  res.set('X-RateLimit-Limit', limit.toString());
  res.set('X-RateLimit-Remaining', remaining.toString());
  res.set('X-RateLimit-Reset', reset.toString());

  if (!success) {
    return res.status(429).json({ error: 'Too Many Requests (Auth Tier). Please try again later.' });
  }
  next();
};

export const publicRateLimitMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const { success, limit, remaining, reset } = await publicRateLimiter.limit(ip);
  
  res.set('X-RateLimit-Limit', limit.toString());
  res.set('X-RateLimit-Remaining', remaining.toString());
  res.set('X-RateLimit-Reset', reset.toString());

  if (!success) {
    return res.status(429).json({ error: 'Too Many Requests. Please try again later.' });
  }
  next();
};

export const userActionRateLimitMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // Use user ID if authenticated, fallback to IP
  const identifier = req.body.userId || req.query.userId || req.ip || req.socket.remoteAddress || '127.0.0.1';
  const { success, limit, remaining, reset } = await authUserRateLimiter.limit(identifier);
  
  res.set('X-RateLimit-Limit', limit.toString());
  res.set('X-RateLimit-Remaining', remaining.toString());
  res.set('X-RateLimit-Reset', reset.toString());

  if (!success) {
    return res.status(429).json({ error: 'Too Many Requests (User Tier). Please try again later.' });
  }
  next();
};
