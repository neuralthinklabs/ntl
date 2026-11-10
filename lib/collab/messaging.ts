import 'server-only'
import { and, eq, or, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { communities, communityMembers, notifications, userBlocks } from '@/db/community-schema'
import { dmConversations } from '@/db/collab-schema'
import { normalizeNtlId } from '@/lib/ntl-id'

export type Person = { id: string; ntlId: string; name: string; role: string; unavailable: boolean }

/** uuid ordering for the (user_low < user_high) rule; ids are lower-case hex so string order = Postgres order. */
export function pairIds(a: string, b: string): [string, string] {
  const x = a.toLowerCase()
  const y = b.toLowerCase()
  return x < y ? [x, y] : [y, x]
}

const toPerson = (p: { id: string; ntlId: string; fullName: string | null; showCredit: boolean; role: string; banned: boolean; until: Date | null }): Person => ({
  id: p.id,
  ntlId: p.ntlId,
  name: p.showCredit ? p.fullName || p.ntlId : p.ntlId,
  role: p.role,
  unavailable: p.banned || (!!p.until && p.until > new Date()),
})

const cols = {
  id: profiles.id, ntlId: profiles.ntlId, fullName: profiles.fullName, showCredit: profiles.showCredit,
  role: profiles.role, banned: profiles.communityBanned, until: profiles.communitySuspendedUntil,
}

export async function loadPerson(rawNtlId: string): Promise<Person | null> {
  const ntl = normalizeNtlId(rawNtlId)
  if (!ntl) return null
  const [p] = await db.select(cols).from(profiles).where(eq(profiles.ntlId, ntl)).limit(1)
  return p ? toPerson(p) : null
}

export async function loadPersonById(id: string): Promise<Person | null> {
  const [p] = await db.select(cols).from(profiles).where(eq(profiles.id, id)).limit(1)
  return p ? toPerson(p) : null
}

export type Decision = { ok: true } | { ok: false; error: string }

/**
 * Who may start or continue a conversation: not blocked either way, neither side
 * restricted community-wide, and the two share an active group (or one is an NTL
 * admin). The shared-group rule is what keeps strangers from mass-messaging.
 */
export async function canMessage(viewer: { id: string; isAdmin: boolean }, target: Person): Promise<Decision> {
  if (target.id === viewer.id) return { ok: false, error: 'You cannot message yourself.' }
  if (target.unavailable) return { ok: false, error: 'That person is not available for messages right now.' }
  const [blocked] = await db
    .select({ a: userBlocks.blockerId })
    .from(userBlocks)
    .where(or(and(eq(userBlocks.blockerId, viewer.id), eq(userBlocks.blockedId, target.id)), and(eq(userBlocks.blockerId, target.id), eq(userBlocks.blockedId, viewer.id))))
    .limit(1)
  if (blocked) return { ok: false, error: 'You cannot message this person.' }
  if (viewer.isAdmin || target.role === 'admin') return { ok: true }

  const b = alias(communityMembers, 'b')
  const [shared] = await db
    .select({ c: communityMembers.communityId })
    .from(communityMembers)
    .innerJoin(b, eq(b.communityId, communityMembers.communityId))
    .innerJoin(communities, eq(communities.id, communityMembers.communityId))
    .where(and(eq(communityMembers.userId, viewer.id), eq(b.userId, target.id), eq(communityMembers.status, 'active'), eq(b.status, 'active'), sql`${communities.archivedAt} is null`))
    .limit(1)
  if (!shared) return { ok: false, error: 'You can message people you share an active group with. Join a group together first.' }
  return { ok: true }
}

export async function findConversation(a: string, b: string) {
  const [low, high] = pairIds(a, b)
  const [c] = await db.select().from(dmConversations).where(and(eq(dmConversations.userLow, low), eq(dmConversations.userHigh, high))).limit(1)
  return c ?? null
}

/** Moves this person's read pointer to now. */
export async function markRead(conversationId: string, userId: string) {
  await db
    .update(dmConversations)
    .set({
      lowReadAt: sql`case when ${dmConversations.userLow} = ${userId}::uuid then now() else ${dmConversations.lowReadAt} end`,
      highReadAt: sql`case when ${dmConversations.userHigh} = ${userId}::uuid then now() else ${dmConversations.highReadAt} end`,
    })
    .where(eq(dmConversations.id, conversationId))
}

/** Opening a thread also clears the "X sent you a message" notification. */
export async function markMessageNotificationsRead(userId: string, otherId: string) {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), eq(notifications.actorId, otherId), eq(notifications.type, 'message'), sql`${notifications.readAt} is null`))
}
