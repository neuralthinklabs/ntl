import { count, eq } from 'drizzle-orm'
import { db } from '@/db'
import { profiles, events, portfolioItems, problems } from '@/db/schema'

// Real numbers only. These replace the hard-coded "1.2K people engaged" etc.
export async function getHomeStats() {
  const [[m], [e], [p], [r]] = await Promise.all([
    db.select({ n: count() }).from(profiles),
    db.select({ n: count() }).from(events),
    db.select({ n: count() }).from(portfolioItems).where(eq(portfolioItems.status, 'Active')),
    db.select({ n: count() }).from(problems),
  ])
  return [
    { value: String(p?.n ?? 0), label: 'Active projects' },
    { value: String(e?.n ?? 0), label: 'Community events' },
    { value: String(r?.n ?? 0), label: 'Problems submitted' },
    { value: String(m?.n ?? 0), label: 'Community members' },
  ]
}

