import { and, count, eq, inArray } from 'drizzle-orm'
import { db } from '@/db'
import { achievements, contributions, eventRegistrations, problems, userAchievements } from '@/db/schema'
import { awardPoints } from '@/lib/points'
import { earnedSlugs } from './achievement-rules'

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

/**
 * Grants any achievements the person now qualifies for, once each, with the
 * points and an activity-feed row. Call it inside the same transaction as the
 * thing that may have earned one (problem submitted, attendance marked,
 * payment confirmed). Returns the titles that were newly unlocked.
 */
export async function checkAchievements(userId: string, executor: Tx | typeof db = db): Promise<string[]> {
  const [p] = await executor.select({ n: count() }).from(problems).where(eq(problems.submittedBy, userId))
  const [e] = await executor
    .select({ n: count() })
    .from(eventRegistrations)
    .where(and(eq(eventRegistrations.userId, userId), eq(eventRegistrations.status, 'attended')))
  const [c] = await executor
    .select({ n: count() })
    .from(contributions)
    .where(and(eq(contributions.userId, userId), eq(contributions.status, 'confirmed')))

  const slugs = earnedSlugs({ problems: p?.n ?? 0, eventsAttended: e?.n ?? 0, confirmedPledges: c?.n ?? 0 })
  if (!slugs.length) return []

  const defs = await executor.select().from(achievements).where(inArray(achievements.slug, slugs))
  if (!defs.length) return []

  const inserted = await executor
    .insert(userAchievements)
    .values(defs.map((d) => ({ userId, achievementId: d.id })))
    .onConflictDoNothing()
    .returning({ achievementId: userAchievements.achievementId })
  const fresh = new Set(inserted.map((r) => r.achievementId))

  const unlocked: string[] = []
  for (const d of defs) {
    if (!fresh.has(d.id)) continue
    await awardPoints({
      executor,
      userId,
      points: d.pointsAwarded,
      type: 'achievement_earned',
      title: `Achievement unlocked: ${d.title}`,
      meta: d.pointsAwarded ? `${d.description ?? ''} · +${d.pointsAwarded} pts`.trim() : (d.description ?? undefined),
      relatedId: d.id,
    })
    unlocked.push(d.title)
  }
  return unlocked
}
