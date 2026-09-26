import type { Config } from '@netlify/functions'

// Requires `pnpm add -D @netlify/functions`. Calls the Next.js route at
// app/api/cron/cleanup-auth-attempts/route.ts on a schedule — see that
// file for what it does and why.
export default async () => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const secret = process.env.CRON_SECRET

  if (!siteUrl) {
    console.error('[cleanup-auth-attempts] NEXT_PUBLIC_SITE_URL not set — skipping.')
    return
  }

  const res = await fetch(`${siteUrl}/api/cron/cleanup-auth-attempts`, {
    headers: secret ? { Authorization: `Bearer ${secret}` } : {},
  })

  if (!res.ok) {
    console.error('[cleanup-auth-attempts] cleanup request failed:', res.status)
  }
}

export const config: Config = {
  schedule: '0 * * * *', // hourly
}
