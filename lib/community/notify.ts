import 'server-only'
import { and, eq, inArray, ne } from 'drizzle-orm'
import { db } from '@/db'
import { communityMembers, notifications } from '@/db/community-schema'

type Row = {
  userId: string
  type: (typeof notifications.$inferInsert)['type']
  title: string
  body?: string | null
  link?: string | null
  actorId?: string | null
}

/** Notifications must never break the action that caused them. */
export async function notify(rows: Row[]) {
  const list = rows.filter((r) => r.userId !== r.actorId)
  if (!list.length) return
  try {
    await db.insert(notifications).values(
      list.map((r) => ({ userId: r.userId, type: r.type, title: r.title.slice(0, 200), body: r.body?.slice(0, 500) ?? null, link: r.link ?? null, actorId: r.actorId ?? null })),
    )
  } catch (err) {
    console.error('[community] notify failed:', err)
  }
}

/** Leaders and moderators of a group (active only). */
export async function staffOf(communityId: string, exceptUserId?: string) {
  const rows = await db
    .select({ userId: communityMembers.userId })
    .from(communityMembers)
    .where(
      and(
        eq(communityMembers.communityId, communityId),
        eq(communityMembers.status, 'active'),
        inArray(communityMembers.role, ['moderator', 'leader']),
        exceptUserId ? ne(communityMembers.userId, exceptUserId) : undefined,
      ),
    )
  return rows.map((r) => r.userId)
}

export async function notifyStaff(communityId: string, payload: Omit<Row, 'userId'>) {
  const ids = await staffOf(communityId, payload.actorId ?? undefined)
  await notify(ids.map((userId) => ({ ...payload, userId })))
}
