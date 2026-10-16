import { and, desc, eq, isNotNull, lte } from 'drizzle-orm'
import { db } from '@/db'
import { goals, profiles, projectContributors, stories } from '@/db/schema'
import { normalizeNtlId } from '@/lib/ntl-id'
import { publicRoleLabel } from '@/lib/roles'

// Public credits. Everything here selects ONLY name, bio, NTL ID and role.
// Never email or any other column, and only people with show_credit = true.

export type GoalContributor = { ntlId: string; name: string; roleLabel: string }

export async function getGoalContributors(goalId: string): Promise<GoalContributor[]> {
  const rows = await db
    .select({
      ntlId: profiles.ntlId,
      name: profiles.fullName,
      roleLabel: projectContributors.roleLabel,
    })
    .from(projectContributors)
    .innerJoin(profiles, eq(projectContributors.userId, profiles.id))
    .where(and(eq(projectContributors.goalId, goalId), eq(profiles.showCredit, true)))
    .orderBy(projectContributors.createdAt)
  return rows.map((r) => ({ ntlId: r.ntlId, name: r.name || r.ntlId, roleLabel: r.roleLabel }))
}

export async function getPublicProfile(raw: string) {
  const ntlId = normalizeNtlId(raw)
  if (!ntlId) return null

  const [p] = await db
    .select({ id: profiles.id, fullName: profiles.fullName, bio: profiles.bio, ntlId: profiles.ntlId, role: profiles.role })
    .from(profiles)
    .where(and(eq(profiles.ntlId, ntlId), eq(profiles.showCredit, true)))
    .limit(1)
  if (!p) return null

  const now = new Date()
  const [projects, posts] = await Promise.all([
    db
      .select({ slug: goals.slug, title: goals.title, roleLabel: projectContributors.roleLabel })
      .from(projectContributors)
      .innerJoin(goals, eq(projectContributors.goalId, goals.id))
      .where(eq(projectContributors.userId, p.id)),
    db
      .select({ slug: stories.slug, title: stories.title, publishedAt: stories.publishedAt })
      .from(stories)
      .where(and(eq(stories.authorId, p.id), isNotNull(stories.publishedAt), lte(stories.publishedAt, now)))
      .orderBy(desc(stories.publishedAt))
      .limit(20),
  ])

  return {
    name: p.fullName || p.ntlId,
    bio: p.bio,
    ntlId: p.ntlId,
    roleLabel: publicRoleLabel(p.role),
    projects,
    posts,
  }
}
