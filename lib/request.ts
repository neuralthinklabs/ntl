import { headers } from 'next/headers'

// Best-effort client IP. Prefer headers that the hosting platform sets itself
// (and that a client cannot forge) over the generic X-Forwarded-For list.
export async function clientIp(): Promise<string | undefined> {
  const h = await headers()
  return (
    h.get('x-nf-client-connection-ip') || // Netlify
    h.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() || // Vercel
    h.get('x-real-ip') ||
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    undefined
  )
}
