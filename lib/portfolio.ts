import { asc } from 'drizzle-orm'
import { db } from '@/db'
import { portfolioItems } from '@/db/schema'

export { PORTFOLIO_TYPES, PORTFOLIO_STATUSES, type PortfolioType } from './portfolio-constants'

export async function getAllPortfolioItems() {
  return db.query.portfolioItems.findMany({ orderBy: [asc(portfolioItems.sortOrder)] })
}
