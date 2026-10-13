import { sql, eq } from 'drizzle-orm'
import { db } from '@/db'
import { profiles, activityRecords, type activityTypeEnum } from '@/db/schema'

type ActivityType = (typeof activityTypeEnum.enumValues)[number]
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

/**
 * Single place that grants points and writes the activity-feed row. Pass the
 * `executor` from inside `db.transaction(async (tx) => ...)` so the points
 * and the thing that earned them commit (or roll back) together.
 */
export async function awardPoints(params: {
  userId: string
  points: number
  type: ActivityType
  title: string
  meta?: string
  relatedId?: string
  executor?: Tx | typeof db
}) {
  const { userId, points, type, title, meta, relatedId, executor = db } = params

  await executor.insert(activityRecords).values({
    userId,
    type,
    title,
    meta,
    pointsDelta: points,
    relatedId,
  })

  if (points !== 0) {
    await executor
      .update(profiles)
      .set({ points: sql`${profiles.points} + ${points}` })
      .where(eq(profiles.id, userId))
  }
}
