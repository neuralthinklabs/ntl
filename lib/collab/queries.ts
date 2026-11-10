import 'server-only'
import { and, asc, desc, eq, inArray, ne, or, sql } from 'drizzle-orm'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { communities } from '@/db/community-schema'
import {
  communityEmailPrefs, communityMeetings, communityTasks, dmConversations, dmMessages, dmReports, taskComments,
} from '@/db/collab-schema'

const displayName = sql<string>`case when ${profiles.showCredit} then coalesce(${profiles.fullName}, ${profiles.ntlId}) else ${profiles.ntlId} end`

// ---- Direct messages --------------------------------------------------------

export async function getConversations(userId: string) {
  const mineRead = sql`case when ${dmConversations.userLow} = ${userId}::uuid then ${dmConversations.lowReadAt} else ${dmConversations.highReadAt} end`
  const rows = await db
    .select({
      id: dmConversations.id,
      low: dmConversations.userLow,
      high: dmConversations.userHigh,
      lastMessageAt: dmConversations.lastMessageAt,
      lastBody: sql<string | null>`(select m.body from dm_messages m where m.conversation_id = ${dmConversations.id} order by m.created_at desc limit 1)`,
      lastDeleted: sql<boolean | null>`(select (m.deleted_at is not null) from dm_messages m where m.conversation_id = ${dmConversations.id} order by m.created_at desc limit 1)`,
      unread: sql<number>`(select count(*)::int from dm_messages m where m.conversation_id = ${dmConversations.id} and m.sender_id is distinct from ${userId}::uuid and m.deleted_at is null and m.created_at > coalesce(${mineRead}, 'epoch'::timestamptz))`,
    })
    .from(dmConversations)
    .where(or(eq(dmConversations.userLow, userId), eq(dmConversations.userHigh, userId)))
    .orderBy(desc(dmConversations.lastMessageAt))
    .limit(50)
  if (!rows.length) return []
  const otherIds = rows.map((r) => (r.low === userId ? r.high : r.low))
  const people = await db
    .select({ id: profiles.id, ntlId: profiles.ntlId, name: displayName })
    .from(profiles)
    .where(inArray(profiles.id, otherIds))
  const byId = new Map(people.map((p) => [p.id, p]))
  return rows.map((r) => {
    const otherId = r.low === userId ? r.high : r.low
    const o = byId.get(otherId)
    return { id: r.id, otherId, otherNtlId: o?.ntlId ?? '', otherName: o?.name ?? 'Former member', lastBody: r.lastBody, lastDeleted: !!r.lastDeleted, lastMessageAt: r.lastMessageAt, unread: r.unread }
  })
}

export type ThreadMessage = { id: string; senderId: string | null; body: string; deletedAt: Date | null; createdAt: Date }

/** Latest `limit` messages, oldest first. */
export async function getThreadMessages(conversationId: string, limit = 100): Promise<ThreadMessage[]> {
  const rows = await db
    .select({ id: dmMessages.id, senderId: dmMessages.senderId, body: dmMessages.body, deletedAt: dmMessages.deletedAt, createdAt: dmMessages.createdAt })
    .from(dmMessages)
    .where(eq(dmMessages.conversationId, conversationId))
    .orderBy(desc(dmMessages.createdAt))
    .limit(limit)
  return rows.reverse()
}

export async function getOpenDmReports() {
  return db
    .select({
      id: dmReports.id, reason: dmReports.reason, details: dmReports.details, snapshot: dmReports.snapshot, createdAt: dmReports.createdAt,
      reporter: sql<string | null>`(select p.ntl_id from profiles p where p.id = ${dmReports.reporterId})`,
      reported: sql<string | null>`(select p.ntl_id from profiles p where p.id = ${dmReports.reportedUserId})`,
    })
    .from(dmReports)
    .where(eq(dmReports.status, 'open'))
    .orderBy(asc(dmReports.createdAt))
    .limit(100)
}

// ---- Meetings ---------------------------------------------------------------

export async function getMeetings(communityId: string, viewerId: string | null) {
  return db
    .select({
      id: communityMeetings.id, title: communityMeetings.title, description: communityMeetings.description, agenda: communityMeetings.agenda,
      location: communityMeetings.location, meetingUrl: communityMeetings.meetingUrl, timezone: communityMeetings.timezone,
      startsAt: communityMeetings.startsAt, endsAt: communityMeetings.endsAt, status: communityMeetings.status,
      cancelReason: communityMeetings.cancelReason, minutes: communityMeetings.minutes,
      going: sql<number>`(select count(*)::int from meeting_rsvps r where r.meeting_id = ${communityMeetings.id} and r.response = 'going')`,
      maybe: sql<number>`(select count(*)::int from meeting_rsvps r where r.meeting_id = ${communityMeetings.id} and r.response = 'maybe')`,
      mine: viewerId
        ? sql<string | null>`(select r.response from meeting_rsvps r where r.meeting_id = ${communityMeetings.id} and r.user_id = ${viewerId}::uuid)`
        : sql<string | null>`null`,
    })
    .from(communityMeetings)
    .where(eq(communityMeetings.communityId, communityId))
    .orderBy(desc(communityMeetings.startsAt))
    .limit(100)
}

// ---- Tasks ------------------------------------------------------------------

export async function getTasks(communityId: string) {
  return db
    .select({
      id: communityTasks.id, title: communityTasks.title, description: communityTasks.description, status: communityTasks.status,
      priority: communityTasks.priority, dueDate: communityTasks.dueDate, assigneeId: communityTasks.assigneeId,
      assigneeName: sql<string | null>`${displayName}`, createdAt: communityTasks.createdAt,
    })
    .from(communityTasks)
    .leftJoin(profiles, eq(communityTasks.assigneeId, profiles.id))
    .where(eq(communityTasks.communityId, communityId))
    .orderBy(asc(communityTasks.dueDate), desc(communityTasks.createdAt))
    .limit(500)
}

export async function getTaskComments(taskIds: string[]) {
  if (!taskIds.length) return []
  return db
    .select({ id: taskComments.id, taskId: taskComments.taskId, body: taskComments.body, createdAt: taskComments.createdAt, author: sql<string | null>`${displayName}` })
    .from(taskComments)
    .leftJoin(profiles, eq(taskComments.authorId, profiles.id))
    .where(inArray(taskComments.taskId, taskIds))
    .orderBy(asc(taskComments.createdAt))
    .limit(1000)
}

/** Open and recently finished tasks assigned to a person, across every group they are in. */
export async function getMyTasks(userId: string) {
  return db
    .select({
      id: communityTasks.id, title: communityTasks.title, status: communityTasks.status, priority: communityTasks.priority,
      dueDate: communityTasks.dueDate, groupName: communities.name, groupSlug: communities.slug, groupVisibility: communities.visibility,
    })
    .from(communityTasks)
    .innerJoin(communities, eq(communityTasks.communityId, communities.id))
    .where(and(eq(communityTasks.assigneeId, userId), sql`${communities.archivedAt} is null`, ne(communityTasks.status, 'done')))
    .orderBy(asc(communityTasks.dueDate), desc(communityTasks.createdAt))
    .limit(200)
}

// ---- Preferences ------------------------------------------------------------

export async function getDigestPref(userId: string) {
  const [p] = await db.select({ digest: communityEmailPrefs.digest }).from(communityEmailPrefs).where(eq(communityEmailPrefs.userId, userId)).limit(1)
  return p?.digest ?? 'off'
}
