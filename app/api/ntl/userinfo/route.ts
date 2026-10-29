import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { createClient } from '@supabase/supabase-js'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { checkRateLimit, ipIdentifier, recordAttempt } from '@/lib/rate-limit'
import { getClientIp } from '@/lib/ip'

// Partner sites call this with the access token they received from NTL:
//   GET /api/ntl/userinfo   Authorization: Bearer <access_token>
// It returns the stable user id (`sub`) and, when the token's scopes allow it,
// the NTL ID, public name and email. People who turned off public credit
// never have their name returned.
//
// Only FAILED lookups count toward the rate limit, so a partner server making
// many valid calls from one IP is never throttled, while token guessing is.
export const dynamic = 'force-dynamic'

const FAILS_PER_WINDOW = 30
const NO_STORE = { 'Cache-Control': 'no-store' }

async function reject(ip: string | undefined) {
  await recordAttempt(ipIdentifier('userinfo-fail', ip)).catch((e) => console.error('[userinfo] record failed:', e))
  return NextResponse.json(
    { error: 'invalid_token' },
    { status: 401, headers: { 'WWW-Authenticate': 'Bearer', ...NO_STORE } },
  )
}

/** Reads the `scope` claim from the JWT payload (already verified by getUser below). */
function scopesOf(token: string): string[] | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')) as { scope?: unknown }
    if (typeof payload.scope === 'string') return payload.scope.split(/\s+/).filter(Boolean)
    if (Array.isArray(payload.scope)) return payload.scope.map(String)
    return null
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const ip = await getClientIp()
  const limit = await checkRateLimit(ipIdentifier('userinfo-fail', ip), FAILS_PER_WINDOW)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds), ...NO_STORE } },
    )
  }

  const m = /^Bearer\s+([\w-]+\.[\w-]+\.[\w-]+)$/.exec(request.headers.get('authorization') ?? '')
  if (!m) return reject(ip)
  const token = m[1]

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const {
    data: { user },
    error,
  } = await sb.auth.getUser(token)
  if (error || !user) return reject(ip)

  const scopes = scopesOf(token) // null = token carries no scope claim
  const out: Record<string, unknown> = { sub: user.id }

  if (scopes === null || scopes.includes('profile')) {
    const p = await db.query.profiles.findFirst({ where: eq(profiles.id, user.id) })
    if (p) {
      out.ntl_id = p.ntlId
      if (p.showCredit && p.fullName) out.name = p.fullName
    }
  }
  if (scopes?.includes('email') && user.email) {
    out.email = user.email
    out.email_verified = !!user.email_confirmed_at
  }

  return NextResponse.json(out, { headers: NO_STORE })
}
