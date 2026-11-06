import 'server-only'
import { and, asc, count, desc, eq, ilike, inArray, ne, or, sql, type SQL } from 'drizzle-orm'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import {
  communities, communityComments, communityMembers, communityPosts, communityReports, communityAppeals,
  moderationActions, notifications, pollOptions, pollVotes, userBlocks,
} from '@/db/community-schema'
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination'

const displayName = sql<string>`case when ${profiles.showCredit} then coalesce(${profiles.fullName}, ${profiles.ntlId}) else ${profiles.ntlId} end`

export type FeedPost = {
  id: string
  type: string
  title: string | null
  body: string
  linkUrl: string | null
  eventStartsAt: Date | null
  eventLocation: string | null
  pollClosesAt: Date | null
  status: string
  pinned: boolean
  createdAt: Date
  communityId: string
  communityName: string
  communitySlug: string
  communityVisibility: string
  authorId: string | null
  authorName: string
  authorNtlId: string | null
  authorVerified: boolean
  comments: number
  reactions: number
  myReaction: string | null
}

function postFields(viewerId: string | null) {
  return {
    id: communityPosts.id,
    type: communityPosts.type,
    title: communityPosts.title,
    body: communityPosts.body,
    linkUrl: communityPosts.linkUrl,
    eventStartsAt: communityPosts.eventStartsAt,
    eventLocation: communityPosts.eventLocation,
    pollClosesAt: communityPosts.pollClosesAt,
    status: communityPosts.status,
    pinned: communityPosts.pinned,
    createdAt: communityPosts.createdAt,
    communityId: communityPosts.communityId,
    communityName: communities.name,
    communitySlug: communities.slug,
    communityVisibility: communities.visibility,
    authorId: communityPosts.authorId,
    authorName: sql<string | null>`${displayName}`,
    authorNtlId: profiles.ntlId,
    authorVerified: sql<boolean>`coalesce(${profiles.verifiedContributor}, false)`,
    comments: sql<number>`(select count(*)::int from community_comments c where c.post_id = ${communityPosts.id} and c.status = 'published')`,
    reactions: sql<number>`(select count(*)::int from post_reactions r where r.post_id = ${communityPosts.id})`,
    myReaction: viewerId
      ? sql<string | null>`(select r.kind from post_reactions r where r.post_id = ${communityPosts.id} and r.user_id = ${viewerId})`
      : sql<string | null>`null`,
  }
}

type Raw = Awaited<ReturnType<typeof rawPosts>>[number]
const rawPosts = (viewerId: string | null, where: SQL | undefined, limit: number, offset: number) =>
  db
    .select(postFields(viewerId))
    .from(communityPosts)
    .innerJoin(communities, eq(communityPosts.communityId, communities.id))
    .leftJoin(profiles, eq(communityPosts.authorId, profiles.id))
    .where(where)
    .orderBy(desc(communityPosts.pinned), desc(communityPosts.createdAt))
    .limit(limit)
    .offset(offset)

const toPost = (r: Raw): FeedPost => ({ ...r, authorName: r.authorName ?? 'Former member' })

/**
 * Published posts. With `communityId` the CALLER must already have checked the
 * viewer may read that group (loadGroup / guard). Without it, only public groups
 * and groups the viewer belongs to appear, and internal groups never do.
 */
export async function getFeed(o: {
  viewerId: string | null
  page: number
  type?: string
  communityId?: string
  authorId?: string
}) {
  const conds: (SQL | undefined)[] = [eq(communityPosts.status, 'published')]
  if (o.communityId) conds.push(eq(communityPosts.communityId, o.communityId))
  else {
    conds.push(ne(communities.visibility, 'internal'))
    const member = o.viewerId
      ? sql`${communityPosts.communityId} in (select community_id from community_members where user_id = ${o.viewerId} and status in ('active','suspended'))`
      : sql`false`
    conds.push(or(eq(communities.visibility, 'public'), member))
  }
  if (o.type) conds.push(eq(communityPosts.type, o.type as 'discussion'))
  if (o.authorId) conds.push(eq(communityPosts.authorId, o.authorId))
  if (o.viewerId) {
    conds.push(sql`not exists (select 1 from user_blocks b where b.blocker_id = ${o.viewerId} and b.blocked_id = ${communityPosts.authorId})`)
  }
  const where = and(...conds)
  const [rows, [{ value }]] = await Promise.all([
    rawPosts(o.viewerId, where, DEFAULT_PAGE_SIZE, (o.page - 1) * DEFAULT_PAGE_SIZE),
    db
      .select({ value: count() })
      .from(communityPosts)
      .innerJoin(communities, eq(communityPosts.communityId, communities.id))
      .where(where),
  ])
  return { items: rows.map(toPost), total: value }
}

/** One post in any status; the caller checks access to its group. */
export async function getPost(id: string, viewerId: string | null) {
  const [row] = await rawPosts(viewerId, eq(communityPosts.id, id), 1, 0)
  return row ? toPost(row) : null
}

export async function getPendingPosts(communityId: string) {
  const rows = await rawPosts(null, and(eq(communityPosts.communityId, communityId), eq(communityPosts.status, 'pending')), 50, 0)
  return rows.map(toPost)
}

export type PollView = { options: { id: string; label: string; votes: number }[]; myOptionId: string | null; total: number }

export async function getPollData(postIds: string[], viewerId: string | null): Promise<Record<string, PollView>> {
  if (!postIds.length) return {}
  const opts = await db
    .select({
      postId: pollOptions.postId,
      id: pollOptions.id,
      label: pollOptions.label,
      votes: sql<number>`(select count(*)::int from poll_votes v where v.option_id = ${pollOptions.id})`,
    })
    .from(pollOptions)
    .where(inArray(pollOptions.postId, postIds))
    .orderBy(asc(pollOptions.sortOrder))
  const mine = viewerId
    ? await db.select({ postId: pollVotes.postId, optionId: pollVotes.optionId }).from(pollVotes).where(and(eq(pollVotes.userId, viewerId), inArray(pollVotes.postId, postIds)))
    : []
  const out: Record<string, PollView> = {}
  for (const o of opts) {
    const p = (out[o.postId] ??= { options: [], myOptionId: null, total: 0 })
    p.options.push({ id: o.id, label: o.label, votes: o.votes })
    p.total += o.votes
  }
  for (const m of mine) if (out[m.postId]) out[m.postId].myOptionId = m.optionId
  return out
}

export type CommentView = { id: string; parentId: string | null; body: string; createdAt: Date; authorId: string | null; authorName: string; authorNtlId: string | null }

export async function getComments(postId: string, viewerId: string | null): Promise<CommentView[]> {
  const rows = await db
    .select({
      id: communityComments.id,
      parentId: communityComments.parentId,
      body: communityComments.body,
      createdAt: communityComments.createdAt,
      authorId: communityComments.authorId,
      authorName: sql<string | null>`${displayName}`,
      authorNtlId: profiles.ntlId,
    })
    .from(communityComments)
    .leftJoin(profiles, eq(communityComments.authorId, profiles.id))
    .where(
      and(
        eq(communityComments.postId, postId),
        eq(communityComments.status, 'published'),
        viewerId ? sql`not exists (select 1 from user_blocks b where b.blocker_id = ${viewerId} and b.blocked_id = ${communityComments.authorId})` : undefined,
      ),
    )
    .orderBy(asc(communityComments.createdAt))
    .limit(300)
  return rows.map((r) => ({ ...r, authorName: r.authorName ?? 'Former member' }))
}

export type GroupCard = {
  id: string; slug: string; name: string; description: string | null; kind: string; visibility: string
  atlasScope: string | null; members: number; myStatus: string | null
}

/** Discover: listed groups only (public + private). Internal groups never appear. */
export async function listCommunities(o: { viewerId: string | null; q?: string; kind?: string; scope?: string; page: number }) {
  const conds: (SQL | undefined)[] = [
    inArray(communities.visibility, ['public', 'private']),
    sql`${communities.archivedAt} is null`,
    o.q ? ilike(communities.name, `%${o.q.replace(/[\\%_]/g, '\\$&')}%`) : undefined,
    o.kind ? eq(communities.kind, o.kind as 'interest') : undefined,
    o.scope ? eq(communities.atlasScope, o.scope) : undefined,
  ]
  const where = and(...conds)
  const [rows, [{ value }]] = await Promise.all([
    db
      .select({
        id: communities.id, slug: communities.slug, name: communities.name, description: communities.description,
        kind: communities.kind, visibility: communities.visibility, atlasScope: communities.atlasScope,
        members: sql<number>`(select count(*)::int from community_members m where m.community_id = ${communities.id} and m.status = 'active')`,
        myStatus: o.viewerId
          ? sql<string | null>`(select m.status::text from community_members m where m.community_id = ${communities.id} and m.user_id = ${o.viewerId})`
          : sql<string | null>`null`,
      })
      .from(communities)
      .where(where)
      .orderBy(asc(communities.name))
      .limit(DEFAULT_PAGE_SIZE)
      .offset((o.page - 1) * DEFAULT_PAGE_SIZE),
    db.select({ value: count() }).from(communities).where(where),
  ])
  return { items: rows as GroupCard[], total: value }
}

export async function getMyGroups(userId: string, internal: boolean, isAdmin = false) {
  const vis = internal ? eq(communities.visibility, 'internal') : ne(communities.visibility, 'internal')
  if (internal && isAdmin) {
    return db
      .select({ id: communities.id, slug: communities.slug, name: communities.name, kind: communities.kind, visibility: communities.visibility, description: communities.description, role: sql<string>`'admin'`, status: sql<string>`'active'` })
      .from(communities)
      .where(and(vis, sql`${communities.archivedAt} is null`))
      .orderBy(asc(communities.name))
  }
  return db
    .select({ id: communities.id, slug: communities.slug, name: communities.name, kind: communities.kind, visibility: communities.visibility, description: communities.description, role: sql<string>`${communityMembers.role}::text`, status: sql<string>`${communityMembers.status}::text` })
    .from(communityMembers)
    .innerJoin(communities, eq(communityMembers.communityId, communities.id))
    .where(and(eq(communityMembers.userId, userId), vis, sql`${communities.archivedAt} is null`))
    .orderBy(asc(communities.name))
}

/** Groups the person can post to from the global composer. */
export async function getPostableGroups(userId: string) {
  return db
    .select({ id: communities.id, name: communities.name, kind: communities.kind, role: communityMembers.role })
    .from(communityMembers)
    .innerJoin(communities, eq(communityMembers.communityId, communities.id))
    .where(and(eq(communityMembers.userId, userId), eq(communityMembers.status, 'active'), ne(communities.visibility, 'internal'), sql`${communities.archivedAt} is null`))
    .orderBy(asc(communities.name))
}

export async function getMemberCount(communityId: string) {
  const [r] = await db.select({ n: count() }).from(communityMembers).where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.status, 'active')))
  return r?.n ?? 0
}

export async function getMembers(communityId: string) {
  return db
    .select({
      userId: communityMembers.userId, role: communityMembers.role, status: communityMembers.status, suspendedUntil: communityMembers.suspendedUntil, joinedAt: communityMembers.joinedAt,
      name: sql<string>`${displayName}`, ntlId: profiles.ntlId, verified: profiles.verifiedContributor,
    })
    .from(communityMembers)
    .innerJoin(profiles, eq(communityMembers.userId, profiles.id))
    .where(eq(communityMembers.communityId, communityId))
    .orderBy(asc(communityMembers.status), desc(communityMembers.role), asc(profiles.fullName))
    .limit(500)
}

export async function getOpenReports(o: { communityId?: string }) {
  return db
    .select({
      id: communityReports.id, communityId: communityReports.communityId, communityName: communities.name,
      reason: communityReports.reason, details: communityReports.details, createdAt: communityReports.createdAt,
      postId: communityReports.postId, commentId: communityReports.commentId,
      postTitle: communityPosts.title, postBody: communityPosts.body, commentBody: communityComments.body,
      targetUserId: sql<string | null>`coalesce(${communityPosts.authorId}, ${communityComments.authorId})`,
    })
    .from(communityReports)
    .innerJoin(communities, eq(communityReports.communityId, communities.id))
    .leftJoin(communityPosts, eq(communityReports.postId, communityPosts.id))
    .leftJoin(communityComments, eq(communityReports.commentId, communityComments.id))
    .where(and(eq(communityReports.status, 'open'), o.communityId ? eq(communityReports.communityId, o.communityId) : undefined))
    .orderBy(asc(communityReports.createdAt))
    .limit(100)
}

export async function getModLog(o: { communityId?: string; page?: number; limit?: number }) {
  const limit = o.limit ?? 30
  return db
    .select({
      id: moderationActions.id, action: moderationActions.action, reason: moderationActions.reason, createdAt: moderationActions.createdAt,
      expiresAt: moderationActions.expiresAt, communityName: communities.name,
      actorName: sql<string | null>`(select coalesce(p.full_name, p.email) from profiles p where p.id = ${moderationActions.actorId})`,
      targetName: sql<string | null>`(select coalesce(p.full_name, p.email) from profiles p where p.id = ${moderationActions.targetUserId})`,
    })
    .from(moderationActions)
    .leftJoin(communities, eq(moderationActions.communityId, communities.id))
    .where(o.communityId ? eq(moderationActions.communityId, o.communityId) : undefined)
    .orderBy(desc(moderationActions.createdAt))
    .limit(limit)
    .offset(((o.page ?? 1) - 1) * limit)
}

export async function getNotifications(userId: string, page: number) {
  const where = eq(notifications.userId, userId)
  const [rows, [{ value }]] = await Promise.all([
    db.select().from(notifications).where(where).orderBy(desc(notifications.createdAt)).limit(DEFAULT_PAGE_SIZE).offset((page - 1) * DEFAULT_PAGE_SIZE),
    db.select({ value: count() }).from(notifications).where(where),
  ])
  return { items: rows, total: value }
}

export async function getUnreadCount(userId: string) {
  const [r] = await db.select({ n: count() }).from(notifications).where(and(eq(notifications.userId, userId), sql`${notifications.readAt} is null`))
  return r?.n ?? 0
}

export async function getBlockedPeople(userId: string) {
  return db
    .select({ id: profiles.id, name: sql<string>`${displayName}`, ntlId: profiles.ntlId })
    .from(userBlocks)
    .innerJoin(profiles, eq(userBlocks.blockedId, profiles.id))
    .where(eq(userBlocks.blockerId, userId))
}

/** Moderation actions taken against this person, with their appeal if any. */
export async function getMyModeration(userId: string) {
  return db
    .select({
      id: moderationActions.id, action: moderationActions.action, reason: moderationActions.reason,
      createdAt: moderationActions.createdAt, expiresAt: moderationActions.expiresAt, communityName: communities.name,
      appealId: communityAppeals.id, appealStatus: communityAppeals.status, appealNote: communityAppeals.decisionNote,
    })
    .from(moderationActions)
    .leftJoin(communities, eq(moderationActions.communityId, communities.id))
    .leftJoin(communityAppeals, and(eq(communityAppeals.actionId, moderationActions.id), eq(communityAppeals.userId, userId)))
    .where(and(eq(moderationActions.targetUserId, userId), inArray(moderationActions.action, ['remove_post', 'remove_comment', 'warn', 'suspend', 'ban', 'remove_member', 'global_suspend', 'global_ban'])))
    .orderBy(desc(moderationActions.createdAt))
    .limit(50)
}

export async function getPendingAppeals() {
  return db
    .select({
      id: communityAppeals.id, message: communityAppeals.message, createdAt: communityAppeals.createdAt,
      action: moderationActions.action, reason: moderationActions.reason, communityName: communities.name,
      userName: sql<string>`(select coalesce(p.full_name, p.email) from profiles p where p.id = ${communityAppeals.userId})`,
    })
    .from(communityAppeals)
    .innerJoin(moderationActions, eq(communityAppeals.actionId, moderationActions.id))
    .leftJoin(communities, eq(moderationActions.communityId, communities.id))
    .where(eq(communityAppeals.status, 'pending'))
    .orderBy(asc(communityAppeals.createdAt))
    .limit(100)
}

/** Public profile: counts and recent history, restricted to what the viewer may see. */
export async function getParticipation(userId: string) {
  const [[p], [c]] = await Promise.all([
    db.select({ n: count() }).from(communityPosts).innerJoin(communities, eq(communityPosts.communityId, communities.id)).where(and(eq(communityPosts.authorId, userId), eq(communityPosts.status, 'published'), eq(communities.visibility, 'public'))),
    db.select({ n: count() }).from(communityComments).innerJoin(communityPosts, eq(communityComments.postId, communityPosts.id)).innerJoin(communities, eq(communityPosts.communityId, communities.id)).where(and(eq(communityComments.authorId, userId), eq(communityComments.status, 'published'), eq(communities.visibility, 'public'))),
  ])
  const groups = await db
    .select({ slug: communities.slug, name: communities.name, role: communityMembers.role })
    .from(communityMembers)
    .innerJoin(communities, eq(communityMembers.communityId, communities.id))
    .where(and(eq(communityMembers.userId, userId), eq(communityMembers.status, 'active'), eq(communities.visibility, 'public'), sql`${communities.archivedAt} is null`))
    .orderBy(asc(communities.name))
  return { posts: p?.n ?? 0, comments: c?.n ?? 0, groups }
}
