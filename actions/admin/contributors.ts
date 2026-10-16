'use server'

import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { goals, profiles, projectContributors } from '@/db/schema'
import { runAdmin } from '@/lib/admin-action'
import { normalizeNtlId } from '@/lib/ntl-id'
import type { ActionState } from '../auth'

async function revalidateGoal(goalId: string) {
  const g = await db.query.goals.findFirst({ where: eq(goals.id, goalId) })
  if (g) revalidatePath(`/goals/${g.slug}`)
  revalidatePath(`/admin/campaigns/${goalId}`)
}

/** Credit a person on a campaign by their NTL ID. */
export async function addContributor(goalId: string, ntlIdRaw: string, roleLabel: string): Promise<ActionState> {
  return runAdmin(async () => {
    const id = z.string().uuid().safeParse(goalId)
    if (!id.success) return { error: 'Campaign not found.' }
    const ntlId = normalizeNtlId(ntlIdRaw)
    if (!ntlId) return { error: 'Enter an NTL ID like NTL-7K3M-9QX2.' }
    const label = z.string().trim().max(60).parse(roleLabel || '') || 'Contributor'

    const [person] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.ntlId, ntlId)).limit(1)
    if (!person) return { error: 'No one has that NTL ID.' }

    await db
      .insert(projectContributors)
      .values({ goalId: id.data, userId: person.id, roleLabel: label })
      .onConflictDoUpdate({ target: [projectContributors.goalId, projectContributors.userId], set: { roleLabel: label } })

    await revalidateGoal(id.data)
    return { success: 'Credited.' }
  })
}

export async function removeContributor(goalId: string, userId: string): Promise<ActionState> {
  return runAdmin(async () => {
    const p = z.object({ goalId: z.string().uuid(), userId: z.string().uuid() }).parse({ goalId, userId })
    await db.delete(projectContributors).where(and(eq(projectContributors.goalId, p.goalId), eq(projectContributors.userId, p.userId)))
    await revalidateGoal(p.goalId)
    return { success: 'Removed.' }
  })
}
