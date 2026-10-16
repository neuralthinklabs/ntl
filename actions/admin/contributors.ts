'use server'

import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { goals, portfolioContributors, profiles, projectContributors } from '@/db/schema'
import { runAdmin } from '@/lib/admin-action'
import { logAdmin } from '@/lib/audit'
import type { ActionState } from '../auth'

const uuid = z.string().uuid()
const role = (v: string) => z.string().trim().max(60).parse(v || '') || 'Contributor'

async function personExists(userId: string) {
  const [p] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.id, userId)).limit(1)
  return !!p
}

// ---- Campaigns --------------------------------------------------------------

async function revalidateGoal(goalId: string) {
  const g = await db.query.goals.findFirst({ where: eq(goals.id, goalId) })
  if (g) revalidatePath(`/goals/${g.slug}`)
  revalidatePath(`/admin/campaigns/${goalId}`)
}

export async function addContributor(goalId: string, userId: string, roleLabel: string): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const g = uuid.safeParse(goalId)
    const u = uuid.safeParse(userId)
    if (!g.success || !u.success) return { error: 'Campaign or person not found.' }
    if (!(await personExists(u.data))) return { error: 'That person no longer exists.' }
    const label = role(roleLabel)

    await db
      .insert(projectContributors)
      .values({ goalId: g.data, userId: u.data, roleLabel: label })
      .onConflictDoUpdate({ target: [projectContributors.goalId, projectContributors.userId], set: { roleLabel: label } })

    await logAdmin({ actorId: admin.id, action: 'credit_add', entity: 'campaign', entityId: g.data, summary: u.data })
    await revalidateGoal(g.data)
    return { success: 'Credited.' }
  })
}

export async function removeContributor(goalId: string, userId: string): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const p = z.object({ goalId: uuid, userId: uuid }).parse({ goalId, userId })
    await db
      .delete(projectContributors)
      .where(and(eq(projectContributors.goalId, p.goalId), eq(projectContributors.userId, p.userId)))
    await logAdmin({ actorId: admin.id, action: 'credit_remove', entity: 'campaign', entityId: p.goalId, summary: p.userId })
    await revalidateGoal(p.goalId)
    return { success: 'Removed.' }
  })
}

// ---- Portfolio projects -----------------------------------------------------

function refreshPortfolio(itemId: string) {
  revalidatePath('/portfolio')
  revalidatePath(`/admin/portfolio/${itemId}`)
}

export async function addPortfolioContributor(itemId: string, userId: string, roleLabel: string): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const i = uuid.safeParse(itemId)
    const u = uuid.safeParse(userId)
    if (!i.success || !u.success) return { error: 'Project or person not found.' }
    if (!(await personExists(u.data))) return { error: 'That person no longer exists.' }
    const label = role(roleLabel)

    await db
      .insert(portfolioContributors)
      .values({ portfolioItemId: i.data, userId: u.data, roleLabel: label })
      .onConflictDoUpdate({
        target: [portfolioContributors.portfolioItemId, portfolioContributors.userId],
        set: { roleLabel: label },
      })

    await logAdmin({ actorId: admin.id, action: 'credit_add', entity: 'portfolio', entityId: i.data, summary: u.data })
    refreshPortfolio(i.data)
    return { success: 'Credited.' }
  })
}

export async function removePortfolioContributor(itemId: string, userId: string): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const p = z.object({ itemId: uuid, userId: uuid }).parse({ itemId, userId })
    await db
      .delete(portfolioContributors)
      .where(and(eq(portfolioContributors.portfolioItemId, p.itemId), eq(portfolioContributors.userId, p.userId)))
    await logAdmin({ actorId: admin.id, action: 'credit_remove', entity: 'portfolio', entityId: p.itemId, summary: p.userId })
    refreshPortfolio(p.itemId)
    return { success: 'Removed.' }
  })
}
