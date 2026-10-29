import { headers } from 'next/headers'

const originOf = (u?: string | null) => {
  try {
    return u ? new URL(u).origin : null
  } catch {
    return null
  }
}

// Origin used in links we put in emails (verify email, password reset).
// Building these from the raw Host header lets an attacker request a reset
// with a forged Host and get a victim an email pointing at the attacker's
// site. So the request origin is used ONLY if it is on the allow-list:
// NEXT_PUBLIC_SITE_URL plus any comma-separated ALLOWED_SITE_ORIGINS (e.g.
// preview deployments). Anything else falls back to NEXT_PUBLIC_SITE_URL.
export async function siteUrl() {
  const configured = originOf(process.env.NEXT_PUBLIC_SITE_URL)
  const allowed = new Set<string>()
  if (configured) allowed.add(configured)
  for (const raw of (process.env.ALLOWED_SITE_ORIGINS ?? '').split(',')) {
    const o = originOf(raw.trim())
    if (o) allowed.add(o)
  }

  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  if (host) {
    const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
    const candidate = `${proto}://${host}`
    if (allowed.has(candidate)) return candidate
    if (process.env.NODE_ENV !== 'production' && /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) return candidate
  }
  return configured ?? ''
}
