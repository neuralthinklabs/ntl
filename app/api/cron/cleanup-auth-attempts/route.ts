import { NextResponse } from 'next/server'
import { lt } from 'drizzle-orm'
import { db } from '@/db'
import { authAttempts } from '@/db/schema'

// Scheduled backstop for the opportunistic prune in lib/rate-limit.ts.
// Wire up with ONE of: netlify/functions/cleanup-auth-attempts.ts (hourly) or
// a Vercel cron entry. Requires CRON_SECRET; it FAILS CLOSED without one.
const WINDOW_MS = 15 * 60 * 1000

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET
  if (!expected || request.headers.get('authorization') !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await db.delete(authAttempts).where(lt(authAttempts.createdAt, new Date(Date.now() - WINDOW_MS)))
  return NextResponse.json({ ok: true })
}
