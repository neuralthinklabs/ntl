import { count, gte, and, eq, lt } from 'drizzle-orm'
import { db } from '@/db'
import { authAttempts } from '@/db/schema'

// P1 #6: auth rate limiting / abuse protection.
//
// This app runs on serverless functions (Vercel/Netlify), so an in-memory
// counter (a plain JS Map) does NOT work reliably — each cold start / region
// gets its own memory, so an attacker rotating across instances sails
// through. A durable, shared store is required; since the project already
// has Postgres via Drizzle and no Redis/Upstash is provisioned, this uses a
// small `auth_attempts` table (see supabase/migrations/0003_p1_fixes.sql)
// as the shared counter. If you later add Upstash Redis, swap the body of
// `checkRateLimit`/`recordAttempt` for `@upstash/ratelimit` — the call
// sites in actions/auth.ts don't need to change.
//
// Window: 15 minutes. Limit: 8 attempts per identifier (email OR ip),
// whichever key is passed. Login is checked by IP+email combined so one
// slow attacker can't lock out a real user's email, while still throttling
// credential-stuffing against a single account.

const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 8

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number }

export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - WINDOW_MS)

  const [row] = await db
    .select({ value: count() })
    .from(authAttempts)
    .where(and(eq(authAttempts.identifier, identifier), gte(authAttempts.createdAt, windowStart)))

  const attempts = row?.value ?? 0
  if (attempts >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterSeconds: Math.ceil(WINDOW_MS / 1000) }
  }
  return { allowed: true }
}

export async function recordAttempt(identifier: string) {
  await db.insert(authAttempts).values({ identifier })

  // Opportunistic cleanup — deletes attempts older than the window so the
  // table doesn't grow unbounded. Cheap (indexed on createdAt) and doesn't
  // need a cron job; runs a fraction of the time to keep it low-cost.
  if (Math.random() < 0.05) {
    await db.delete(authAttempts).where(lt(authAttempts.createdAt, new Date(Date.now() - WINDOW_MS)))
  }
}

/** Convenience: combine a request IP and an email/username into one key so
 * the limit applies per (IP, account) pair rather than globally per IP
 * (which would let one attacker lock out unrelated users sharing a NAT/VPN
 * exit) or globally per email (which would let a spoofed-IP attacker be
 * rate-limited independently of a real concurrent user). */
export function authIdentifier(ip: string | undefined, email: string) {
  return `${ip ?? 'unknown-ip'}:${email.toLowerCase().trim()}`
}
