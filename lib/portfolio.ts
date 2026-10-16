import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { portfolioContributors, portfolioItems, profiles } from '@/db/schema'

export { PORTFOLIO_TYPES, PORTFOLIO_STATUSES, type PortfolioType } from './portfolio-constants'

export async function getAllPortfolioItems() {
  return db.query.portfolioItems.findMany({ orderBy: [asc(portfolioItems.sortOrder)] })
}

export type PortfolioPerson = { ntlId: string; name: string; roleLabel: string }

/** Items plus their publicly credited people (only show_credit = true; never email). */
export async function getPortfolioWithPeople() {
  const [items, rows] = await Promise.all([
    getAllPortfolioItems(),
    db
      .select({
        itemId: portfolioContributors.portfolioItemId,
        ntlId: profiles.ntlId,
        name: profiles.fullName,
        roleLabel: portfolioContributors.roleLabel,
      })
      .from(portfolioContributors)
      .innerJoin(profiles, eq(portfolioContributors.userId, profiles.id))
      .where(and(eq(profiles.showCredit, true)))
      .orderBy(asc(portfolioContributors.createdAt)),
  ])
  const byItem = new Map<string, PortfolioPerson[]>()
  for (const r of rows) {
    const list = byItem.get(r.itemId) ?? []
    list.push({ ntlId: r.ntlId, name: r.name || r.ntlId, roleLabel: r.roleLabel })
    byItem.set(r.itemId, list)
  }
  return items.map((i) => ({ ...i, people: byItem.get(i.id) ?? [] }))
}
