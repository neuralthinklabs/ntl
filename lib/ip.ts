import { headers } from 'next/headers'

// Prefer headers that the hosting platform sets itself (clients can't spoof
// them) over the generic x-forwarded-for, which on some setups is
// client-controllable.
export async function getClientIp(): Promise<string | undefined> {
  const h = await headers()
  return (
    h.get('x-nf-client-connection-ip') || // Netlify
    h.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() || // Vercel
    h.get('x-real-ip') ||
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    undefined
  )
}
