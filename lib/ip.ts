import { headers } from 'next/headers'

const first = (v: string | null | undefined) => v?.split(',')[0]?.trim() || undefined

// Only trust a header your hosting platform sets itself. Trusting a header the
// platform does NOT overwrite lets any visitor fake their IP and walk around
// every rate limit.
//   - On Vercel (VERCEL is set at runtime) we use x-vercel-forwarded-for.
//   - On any other host, set TRUSTED_IP_HEADER in your env, e.g.
//     x-nf-client-connection-ip on Netlify, cf-connecting-ip behind Cloudflare.
//   - If neither applies we fall back to x-real-ip / x-forwarded-for, which are
//     only as trustworthy as your proxy. Set TRUSTED_IP_HEADER to be safe.
export async function getClientIp(): Promise<string | undefined> {
  const h = await headers()
  const trusted = process.env.TRUSTED_IP_HEADER?.trim().toLowerCase()
  if (trusted) return first(h.get(trusted))
  if (process.env.VERCEL) return first(h.get('x-vercel-forwarded-for')) ?? first(h.get('x-real-ip'))
  return first(h.get('x-real-ip')) ?? first(h.get('x-forwarded-for'))
}
