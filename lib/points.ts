import { sql } from 'drizzle-orm'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { profiles, activityRecords, type activityTypeEnum } from '@/db/schema'

type ActivityType = (typeof activityTypeEnum.enumValues)[number]

/**
 * P1 #9: single source of truth for "give a user points and log the
 * activity feed entry." Previously this logic (update profiles.points +
 * insert an activityRecords row) was duplicated between
 * actions/problems.ts and actions/goals.ts, with slightly different shapes
 * — a third caller would have been the second copy/paste divergence.
 *
 * Call this from any server action that awards points instead of writing
 * the two-statement pattern inline.
 */
export async function awardPoints(params: {
  userId: string
  points: number
  type: ActivityType
  title: string
  meta?: string
  relatedId?: string
}) {
  const { userId, points, type, title, meta, relatedId } = params

  await db.insert(activityRecords).values({
    userId,
    type,
    title,
    meta,
    pointsDelta: points,
    relatedId,
  })

  await db
    .update(profiles)
    .set({ points: sql`${profiles.points} + ${points}` })
    .where(eq(profiles.id, userId))
}
