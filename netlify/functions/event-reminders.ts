import type { Config } from '@netlify/functions'

// Daily call to app/api/cron/event-reminders/route.ts (only needed if you host on Netlify).
export default async () => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  const secret = process.env.CRON_SECRET
  if (!siteUrl || !secret) {
    console.error('[event-reminders] NEXT_PUBLIC_SITE_URL or CRON_SECRET not set - skipping.')
    return
  }
  const res = await fetch(`${siteUrl}/api/cron/event-reminders`, { headers: { Authorization: `Bearer ${secret}` } })
  if (!res.ok) console.error('[event-reminders] request failed:', res.status)
}

export const config: Config = { schedule: '0 4 * * *' }
