import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { and, eq, inArray, isNotNull, isNull, lt, ne, sql } from 'drizzle-orm'
import { db } from '@/db'
import { communities, communityMembers } from '@/db/community-schema'
import { communityTasks } from '@/db/collab-schema'
import { notify } from '@/lib/community/notify'
import { groupHref } from '@/lib/community/constants'

// Daily housekeeping for the community. Requires CRON_SECRET and fails closed.
//  1. Reactivates members whose suspension has expired (the access rules already
//     treat them as active; this keeps the stored status, member lists and the
//     post composer in step).
//  2. Sends ONE "task due soon" notification per task (due within 36 hours, or
//     already overdue) to its assignee.
export const dynamic = 'force-dynamic'

function sameSecret(given: string, expected: string) {
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET
  if (!expected || !sameSecret(request.headers.get('authorization') ?? '', `Bearer ${expected}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const now = new Date()

  const swept = await db
    .update(communityMembers)
    .set({ status: 'active', suspendedUntil: null })
    .where(and(eq(communityMembers.status, 'suspended'), isNotNull(communityMembers.suspendedUntil), lt(communityMembers.suspendedUntil, now)))
    .returning({ u: communityMembers.userId })

  const until = new Date(now.getTime() + 36 * 60 * 60 * 1000)
  const due = await db
    .select({
      id: communityTasks.id,
      title: communityTasks.title,
      assigneeId: communityTasks.assigneeId,
      group: communities.name,
      slug: communities.slug,
      visibility: communities.visibility,
    })
    .from(communityTasks)
    .innerJoin(communities, eq(communityTasks.communityId, communities.id))
    .where(
      and(
        ne(communityTasks.status, 'done'),
        isNotNull(communityTasks.assigneeId),
        isNotNull(communityTasks.dueDate),
        isNull(communityTasks.reminderSentAt),
        lt(communityTasks.dueDate, until),
        sql`${communities.archivedAt} is null`,
      ),
    )
    .limit(200)

  if (due.length) {
    await notify(
      due.map((t) => ({
        userId: t.assigneeId as string,
        type: 'task_due' as const,
        title: `Task due soon: ${t.title}`,
        body: t.group,
        link: `${groupHref({ slug: t.slug, visibility: t.visibility })}?tab=tasks&mine=1`,
      })),
    )
    await db.update(communityTasks).set({ reminderSentAt: now }).where(inArray(communityTasks.id, due.map((t) => t.id)))
  }
  return NextResponse.json({ ok: true, reactivated: swept.length, taskReminders: due.length })
}
