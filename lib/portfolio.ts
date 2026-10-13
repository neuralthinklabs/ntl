import { asc } from 'drizzle-orm'
import { db } from '@/db'
import { portfolioItems } from '@/db/schema'

export type PortfolioType = 'Product' | 'Service' | 'Venture' | 'System' | 'Publication'
export const PORTFOLIO_TYPES: PortfolioType[] = ['Product', 'Service', 'Venture', 'System', 'Publication']
export const PORTFOLIO_STATUSES = ['Active', 'In Progress', 'Planned', 'Completed'] as const

export async function getAllPortfolioItems() {
  return db.query.portfolioItems.findMany({ orderBy: [asc(portfolioItems.sortOrder)] })
}
