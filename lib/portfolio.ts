import { asc } from 'drizzle-orm'
import { db } from '@/db'
import { portfolioItems } from '@/db/schema'

// P2 follow-up: /portfolio previously rendered from lib/data.ts mock data
// even after goals, events, and stories moved to real tables. This queries
// the real `portfolio_items` table instead — see
// supabase/migrations/0004_p2_admin_contact_and_portfolio.sql for the
// schema + seed data matching the original mock array.
export async function getAllPortfolioItems() {
  return db.query.portfolioItems.findMany({
    orderBy: [asc(portfolioItems.sortOrder)],
  })
}
