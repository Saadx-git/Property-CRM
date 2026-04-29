import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitStore>();

const WINDOW_MS = 60 * 1000; // 1 minute
const AGENT_LIMIT = 50;
const ADMIN_LIMIT = 500;

export function getRateLimit(role: 'admin' | 'agent' | 'unknown') {
  return role === 'admin' ? ADMIN_LIMIT : AGENT_LIMIT;
}

export function rateLimit(identifier: string, limit: number): { success: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now > entry.resetTime) {
    store.set(identifier, { count: 1, resetTime: now + WINDOW_MS });
    return { success: true, remaining: limit - 1, resetIn: WINDOW_MS };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, resetIn: entry.resetTime - now };
  }

  entry.count += 1;
  return { success: true, remaining: limit - entry.count, resetIn: entry.resetTime - now };
}

export function withRateLimit(
  handler: (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>,
  role: 'admin' | 'agent' | 'unknown' = 'unknown'
) {
  return async (req: NextRequest, ...args: unknown[]) => {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const limit = getRateLimit(role);
    const result = rateLimit(`${ip}:${role}`, limit);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(limit),
            'X-RateLimit-Remaining': '0',
            'Retry-After': String(Math.ceil(result.resetIn / 1000)),
          },
        }
      );
    }

    const response = await handler(req, ...args);
    response.headers.set('X-RateLimit-Limit', String(limit));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    return response;
  };
}
