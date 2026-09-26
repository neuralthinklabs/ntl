import { NextResponse } from 'next/server'
import { lt } from 'drizzle-orm'
import { db } from '@/db'
import { authAttempts } from '@/db/schema'

// Scheduled cleanup for the `auth_attempts` rate-limit table (see
// lib/rate-limit.ts). The opportunistic `Math.random() < 0.05` prune in
// `recordAttempt()` is fine at low signup/login volume, but under a spike
// (or just bad luck) it falls behind and the table grows unbounded between
// prunes. This route is a deterministic, scheduled backstop — wire it up
// with ONE of:
//
//  - Netlify Scheduled Functions (this project deploys via netlify.toml):
//    see netlify/functions/cleanup-auth-attempts.ts, which calls this
//    route on an hourly cron schedule. Requires `pnpm add -D @netlify/functions`.
//
//  - Vercel Cron: add to vercel.json:
//      { "crons": [{ "path": "/api/cron/cleanup-auth-attempts", "schedule": "0 * * * *" }] }
//
// Either way, set CRON_SECRET in your environment so this can't be
// triggered by anyone who finds the URL.
const WINDOW_MS = 15 * 60 * 1000

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expected = process.env.CRON_SECRET

  if (expected && authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!expected) {
    console.warn(
      '[cleanup-auth-attempts] CRON_SECRET is not set — this endpoint is unauthenticated. Set it before deploying.',
    )
  }

  await db
    .delete(authAttempts)
    .where(lt(authAttempts.createdAt, new Date(Date.now() - WINDOW_MS)))

  return NextResponse.json({ ok: true })
}
