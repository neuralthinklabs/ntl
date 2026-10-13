import { count, gte, and, eq, lt } from 'drizzle-orm'
import { db } from '@/db'
import { authAttempts } from '@/db/schema'

// Auth rate limiting backed by Postgres (serverless instances do not share
// memory, so an in-process counter would not work). One row per attempt.
// Window: 15 minutes. Callers choose the limit per key.

const WINDOW_MS = 15 * 60 * 1000
export const DEFAULT_MAX_ATTEMPTS = 8

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number }

export async function checkRateLimit(
  identifier: string,
  max = DEFAULT_MAX_ATTEMPTS,
): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - WINDOW_MS)
  const [row] = await db
    .select({ value: count() })
    .from(authAttempts)
    .where(and(eq(authAttempts.identifier, identifier), gte(authAttempts.createdAt, windowStart)))

  if ((row?.value ?? 0) >= max) {
    return { allowed: false, retryAfterSeconds: Math.ceil(WINDOW_MS / 1000) }
  }
  return { allowed: true }
}

export async function recordAttempt(identifier: string) {
  await db.insert(authAttempts).values({ identifier })
  if (Math.random() < 0.05) {
    await db.delete(authAttempts).where(lt(authAttempts.createdAt, new Date(Date.now() - WINDOW_MS)))
  }
}

/** Per (IP, email) key: throttles guessing against one account. */
export function authIdentifier(ip: string | undefined, email: string) {
  return `${ip ?? 'unknown-ip'}:${email.toLowerCase().trim()}`
}

/** Per-IP key: throttles one client spraying many accounts. */
export function ipIdentifier(scope: string, ip: string | undefined) {
  return `${scope}:ip:${ip ?? 'unknown-ip'}`
}

/** Checks both keys; returns an error message if either is over its limit. */
export async function checkAuthLimits(scope: string, ip: string | undefined, email: string) {
  const a = await checkRateLimit(`${scope}:${authIdentifier(ip, email)}`, DEFAULT_MAX_ATTEMPTS)
  const b = await checkRateLimit(ipIdentifier(scope, ip), 30)
  return a.allowed && b.allowed
}

export async function recordAuthAttempt(scope: string, ip: string | undefined, email: string) {
  await recordAttempt(`${scope}:${authIdentifier(ip, email)}`)
  await recordAttempt(ipIdentifier(scope, ip))
}
