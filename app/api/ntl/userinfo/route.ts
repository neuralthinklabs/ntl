import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { createClient } from '@supabase/supabase-js'
import { db } from '@/db'
import { profiles } from '@/db/schema'

// Partner sites call this with the access token they received from NTL:
//   GET /api/ntl/userinfo   Authorization: Bearer <access_token>
// It returns the stable user id (`sub`) and, when the token's scopes allow it,
// the NTL ID, public name and email. People who turned off public credit
// never have their name returned.
export const dynamic = 'force-dynamic'

const unauthorized = () =>
  NextResponse.json({ error: 'invalid_token' }, { status: 401, headers: { 'WWW-Authenticate': 'Bearer', 'Cache-Control': 'no-store' } })

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
  const m = /^Bearer\s+([\w-]+\.[\w-]+\.[\w-]+)$/.exec(request.headers.get('authorization') ?? '')
  if (!m) return unauthorized()
  const token = m[1]

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const {
    data: { user },
    error,
  } = await sb.auth.getUser(token)
  if (error || !user) return unauthorized()

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

  return NextResponse.json(out, { headers: { 'Cache-Control': 'no-store' } })
}
