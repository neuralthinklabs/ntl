import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { lt } from 'drizzle-orm'
import { db } from '@/db'
import { authAttempts } from '@/db/schema'

// Scheduled backstop for the opportunistic prune in lib/rate-limit.ts.
// Scheduled by vercel.json (Vercel sends `Authorization: Bearer $CRON_SECRET`
// automatically) or netlify/functions/cleanup-auth-attempts.ts.
// Requires CRON_SECRET; it FAILS CLOSED without one.
export const dynamic = 'force-dynamic'

const WINDOW_MS = 15 * 60 * 1000

function sameSecret(given: string, expected: string) {
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET
  const given = request.headers.get('authorization') ?? ''
  if (!expected || !sameSecret(given, `Bearer ${expected}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await db.delete(authAttempts).where(lt(authAttempts.createdAt, new Date(Date.now() - WINDOW_MS)))
  return NextResponse.json({ ok: true })
}
