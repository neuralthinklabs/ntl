'use server'

import { z } from 'zod'
import { and, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import {
  communities, communityAppeals, communityComments, communityMembers, communityPosts, communityReports,
  moderationActions, notifications, pollOptions, pollVotes, postReactions, userBlocks,
} from '@/db/community-schema'
import { checkRateLimit, recordAttempt } from '@/lib/rate-limit'
import { getMembership, getViewer, guard } from '@/lib/community/authz'
import { notify, notifyStaff } from '@/lib/community/notify'
import { APPEALABLE, POST_TYPES, REACTION_KINDS, REPORT_REASONS, groupHref } from '@/lib/community/constants'
import { postAttachments } from '@/db/collab-schema'
import { COMMUNITY_MAX_FILES } from '@/lib/collab/constants'
import { readUploads, removeUploads, verifyUploads } from '@/lib/collab/uploads'
import type { ActionState } from './auth'

const uuid = z.string().uuid()

/** At most `max` actions of one kind per person per 15 minutes. */
async function throttle(key: string, max: number): Promise<ActionState> {
  if (!(await checkRateLimit(key, max)).allowed) return { error: 'You are doing that too quickly. Please try again in a few minutes.' }
  await recordAttempt(key)
  return null
}

function refresh(slug?: string, visibility?: string) {
  revalidatePath('/community')
  revalidatePath('/community/groups')
  revalidatePath('/community/discover')
  if (slug) revalidatePath(visibility === 'internal' ? `/workspace/${slug}` : `/community/g/${slug}`)
}

// ---- Membership -------------------------------------------------------------

export async function joinCommunity(communityId: string): Promise<ActionState> {
  const id = uuid.safeParse(communityId)
  if (!id.success) return { error: 'Group not found.' }
  const viewer = await getViewer()
  if (!viewer) return { error: 'Please log in to join.' }
  if (viewer.blocked) return { error: 'Your community access is currently restricted.' }
  const limited = await throttle(`community:join:${viewer.id}`, 20)
  if (limited) return limited

  const [c] = await db.select().from(communities).where(eq(communities.id, id.data)).limit(1)
  // Internal groups are invitation-only and must not reveal themselves.
  if (!c || c.archivedAt || c.visibility === 'internal') return { error: 'Group not found.' }

  const m = await getMembership(c.id, viewer.id)
  if (m) {
    if (m.status === 'active') return { success: 'You are already a member.' }
    if (m.status === 'pending') return { success: 'Your request is already waiting for approval.' }
    return { error: 'You cannot rejoin this group. Please contact its moderators.' }
  }
  const status = c.visibility === 'public' ? 'active' : 'pending'
  await db.insert(communityMembers).values({ communityId: c.id, userId: viewer.id, role: 'member', status }).onConflictDoNothing()
  if (status === 'pending') {
    await notifyStaff(c.id, { type: 'join_request', title: `${viewer.name} asked to join ${c.name}`, link: `${groupHref(c)}?tab=members`, actorId: viewer.id })
  }
  refresh(c.slug, c.visibility)
  return { success: status === 'active' ? `You joined ${c.name}.` : 'Request sent. A group leader will review it.' }
}

export async function leaveCommunity(communityId: string): Promise<ActionState> {
  const id = uuid.safeParse(communityId)
  if (!id.success) return { error: 'Group not found.' }
  const viewer = await getViewer()
  if (!viewer) return { error: 'Please log in.' }
  const [c] = await db.select().from(communities).where(eq(communities.id, id.data)).limit(1)
  const m = c ? await getMembership(c.id, viewer.id) : null
  if (!c || !m) return { error: 'You are not in this group.' }
  // Leaving must not be a way out of a suspension or ban.
  if (m.status === 'banned' || (m.status === 'suspended' && (!m.suspendedUntil || m.suspendedUntil > new Date()))) return { error: 'You cannot leave while a restriction is active.' }
  if (m.role === 'leader') {
    const leaders = await db.select({ n: sql<number>`count(*)::int` }).from(communityMembers).where(and(eq(communityMembers.communityId, c.id), eq(communityMembers.role, 'leader'), eq(communityMembers.status, 'active')))
    if ((leaders[0]?.n ?? 0) <= 1) return { error: 'You are the only leader. Make someone else a leader first.' }
  }
  await db.delete(communityMembers).where(and(eq(communityMembers.communityId, c.id), eq(communityMembers.userId, viewer.id)))
  refresh(c.slug, c.visibility)
  return { success: 'You left the group.' }
}

// ---- Posts ------------------------------------------------------------------

const httpsUrl = z.string().trim().max(500).url('Enter a valid link.').refine((u) => u.startsWith('https://'), 'Links must start with https://')

const postSchema = z.object({
  communityId: uuid,
  type: z.enum(POST_TYPES),
  title: z.string().trim().max(200).optional(),
  body: z.string().trim().min(3, 'Write something first.').max(10000),
  linkUrl: httpsUrl.optional(),
  pollOptions: z.string().max(1500).optional(),
  pollClosesAt: z.string().optional(),
  eventStartsAt: z.string().optional(),
  eventLocation: z.string().trim().max(200).optional(),
  clientRequestId: z.string().uuid('Please reload the page and try again.'),
})

const iso = (v?: string) => {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? undefined : d
}

export async function createPost(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const f = (k: string) => (formData.get(k) as string) || undefined
  const parsed = postSchema.safeParse({
    communityId: formData.get('communityId'),
    type: formData.get('type') || 'discussion',
    title: f('title'),
    body: formData.get('body'),
    linkUrl: f('linkUrl'),
    pollOptions: f('pollOptions'),
    pollClosesAt: f('pollClosesAt'),
    eventStartsAt: f('eventStartsAt'),
    eventLocation: f('eventLocation'),
    clientRequestId: formData.get('clientRequestId'),
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
  const d = parsed.data

  const g = await guard(d.communityId, 'post')
  if (!g.ok) return { error: g.error }
  const { viewer, community, access } = g

  const limited = await throttle(`community:post:${viewer.id}`, 10)
  if (limited) return limited

  if (d.type !== 'discussion' && (d.title?.length ?? 0) < 3) return { error: 'Add a title (at least 3 characters).' }
  if (d.type === 'announcement' && !access.canModerate) return { error: 'Only group leaders and moderators can post announcements.' }
  if (d.type === 'project_update' && community.kind !== 'project' && !access.canModerate) return { error: 'Project updates belong in project groups.' }
  if (d.type === 'event' && !access.canModerate && !viewer.verified) return { error: 'Events are posted by group leaders, moderators and verified contributors.' }
  if (d.type === 'resource' && !d.linkUrl) return { error: 'Add the link to the resource.' }

  let options: string[] = []
  if (d.type === 'poll') {
    options = (d.pollOptions ?? '').split('\n').map((s) => s.trim()).filter(Boolean)
    if (options.length < 2 || options.length > 6) return { error: 'A poll needs 2 to 6 options, one per line.' }
    if (options.some((o) => o.length > 120)) return { error: 'Poll options must be 120 characters or fewer.' }
  }
  const closes = d.type === 'poll' ? iso(d.pollClosesAt) : null
  const starts = d.type === 'event' ? iso(d.eventStartsAt) : null
  if (closes === undefined || starts === undefined) return { error: 'That date is not valid.' }
  if (d.type === 'event' && !starts) return { error: 'Choose when the event starts.' }

  const uploads = readUploads(formData)
  if (!uploads) return { error: `Attachments could not be read. Attach at most ${COMMUNITY_MAX_FILES} files and try again.` }
  if (uploads.length) {
    const bad = await verifyUploads(uploads, `${community.id}/${viewer.id}/${d.clientRequestId}/`)
    if (bad) {
      await removeUploads(uploads.map((u) => u.path))
      return { error: bad }
    }
  }
  const needsApproval = community.requirePostApproval && !access.canModerate && !viewer.verified
  const post = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(communityPosts)
      .values({
        communityId: community.id, authorId: viewer.id, clientRequestId: d.clientRequestId, type: d.type,
        title: d.title || null, body: d.body, linkUrl: d.linkUrl ?? null, eventStartsAt: starts, eventLocation: d.eventLocation || null,
        pollClosesAt: closes, status: needsApproval ? 'pending' : 'published',
      })
      .onConflictDoNothing({ target: communityPosts.clientRequestId })
      .returning({ id: communityPosts.id })
    if (!row) return null
    if (options.length) await tx.insert(pollOptions).values(options.map((label, i) => ({ postId: row.id, label, sortOrder: i })))
    if (uploads.length) await tx.insert(postAttachments).values(uploads.map((u) => ({ postId: row.id, communityId: community.id, storagePath: u.path, fileName: u.name, fileType: u.type ?? null, fileSize: u.size })))
    return row
  })
  if (!post) return { success: 'Already posted.' }

  const link = `/community/post/${post.id}`
  if (needsApproval) {
    await notifyStaff(community.id, { type: 'post_pending', title: `New post waiting for approval in ${community.name}`, link: `${groupHref(community)}?tab=moderation`, actorId: viewer.id })
  } else if (d.type === 'announcement') {
    await db.execute(sql`
      insert into notifications (user_id, type, title, link, actor_id)
      select user_id, 'announcement'::community_notification_type, ${`${community.name}: ${d.title}`}::text, ${link}::text, ${viewer.id}::uuid
      from community_members
      where community_id = ${community.id} and status = 'active' and user_id <> ${viewer.id}`)
  }
  refresh(community.slug, community.visibility)
  return { success: needsApproval ? 'Posted. A moderator will approve it before it appears.' : 'Posted.' }
}

export async function addComment(postId: string, body: string, parentId?: string): Promise<ActionState> {
  const p = z.object({ postId: uuid, body: z.string().trim().min(1, 'Write a comment first.').max(3000), parentId: uuid.optional() }).safeParse({ postId, body, parentId: parentId || undefined })
  if (!p.success) return { error: p.error.issues[0]?.message ?? 'Invalid input.' }

  const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, p.data.postId)).limit(1)
  if (!post || post.status !== 'published') return { error: 'This post is not available.' }
  const g = await guard(post.communityId, 'interact')
  if (!g.ok) return { error: g.error }
  const { viewer, community } = g

  const limited = await throttle(`community:comment:${viewer.id}`, 20)
  if (limited) return limited

  // A person who blocked you can stop you commenting on their posts.
  if (post.authorId) {
    const [b] = await db.select().from(userBlocks).where(and(eq(userBlocks.blockerId, post.authorId), eq(userBlocks.blockedId, viewer.id))).limit(1)
    if (b) return { error: 'You cannot comment on this post.' }
  }
  let parentAuthor: string | null = null
  if (p.data.parentId) {
    const [parent] = await db.select().from(communityComments).where(eq(communityComments.id, p.data.parentId)).limit(1)
    if (!parent || parent.postId !== post.id || parent.status !== 'published') return { error: 'The comment you replied to is gone.' }
    parentAuthor = parent.authorId
  }
  await db.insert(communityComments).values({ postId: post.id, parentId: p.data.parentId ?? null, authorId: viewer.id, body: p.data.body })

  const link = `/community/post/${post.id}`
  const title = post.title || post.body.slice(0, 60)
  const rows = []
  if (post.authorId) rows.push({ userId: post.authorId, type: 'comment' as const, title: `${viewer.name} commented on "${title}"`, body: p.data.body, link, actorId: viewer.id })
  if (parentAuthor && parentAuthor !== post.authorId) rows.push({ userId: parentAuthor, type: 'reply' as const, title: `${viewer.name} replied to your comment`, body: p.data.body, link, actorId: viewer.id })
  await notify(rows)
  revalidatePath(link)
  revalidatePath('/community')
  revalidatePath(groupHref(community))
  return { success: 'Comment posted.' }
}

export async function toggleReaction(postId: string, kind: string): Promise<ActionState> {
  const p = z.object({ postId: uuid, kind: z.enum(REACTION_KINDS) }).safeParse({ postId, kind })
  if (!p.success) return { error: 'Invalid reaction.' }
  const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, p.data.postId)).limit(1)
  if (!post || post.status !== 'published') return { error: 'This post is not available.' }
  const g = await guard(post.communityId, 'interact')
  if (!g.ok) return { error: g.error }
  const limited = await throttle(`community:react:${g.viewer.id}`, 120)
  if (limited) return limited

  const [mine] = await db.select().from(postReactions).where(and(eq(postReactions.postId, post.id), eq(postReactions.userId, g.viewer.id))).limit(1)
  if (mine && mine.kind === p.data.kind) {
    await db.delete(postReactions).where(and(eq(postReactions.postId, post.id), eq(postReactions.userId, g.viewer.id)))
  } else {
    await db.insert(postReactions).values({ postId: post.id, userId: g.viewer.id, kind: p.data.kind }).onConflictDoUpdate({ target: [postReactions.postId, postReactions.userId], set: { kind: p.data.kind } })
  }
  revalidatePath('/community')
  revalidatePath(`/community/post/${post.id}`)
  return { success: 'ok' }
}

export async function votePoll(postId: string, optionId: string): Promise<ActionState> {
  const p = z.object({ postId: uuid, optionId: uuid }).safeParse({ postId, optionId })
  if (!p.success) return { error: 'Invalid vote.' }
  const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, p.data.postId)).limit(1)
  if (!post || post.status !== 'published' || post.type !== 'poll') return { error: 'This poll is not available.' }
  if (post.pollClosesAt && post.pollClosesAt < new Date()) return { error: 'This poll has closed.' }
  const g = await guard(post.communityId, 'interact')
  if (!g.ok) return { error: g.error }
  const [opt] = await db.select().from(pollOptions).where(and(eq(pollOptions.id, p.data.optionId), eq(pollOptions.postId, post.id))).limit(1)
  if (!opt) return { error: 'That option does not exist.' }
  const inserted = await db.insert(pollVotes).values({ postId: post.id, userId: g.viewer.id, optionId: opt.id }).onConflictDoNothing().returning({ id: pollVotes.postId })
  if (!inserted.length) return { error: 'You have already voted in this poll.' }
  revalidatePath('/community')
  revalidatePath(`/community/post/${post.id}`)
  return { success: 'Vote recorded.' }
}

// ---- Safety: reports, blocks, appeals ---------------------------------------

export async function reportContent(input: { postId?: string; commentId?: string; reason: string; details?: string }): Promise<ActionState> {
  const p = z
    .object({ postId: uuid.optional(), commentId: uuid.optional(), reason: z.enum(REPORT_REASONS), details: z.string().trim().max(1000).optional() })
    .refine((v) => !!v.postId !== !!v.commentId, 'Choose one thing to report.')
    .safeParse({ ...input, postId: input.postId || undefined, commentId: input.commentId || undefined, details: input.details || undefined })
  if (!p.success) return { error: p.error.issues[0]?.message ?? 'Invalid report.' }

  let communityId: string | null = null
  if (p.data.postId) {
    const [x] = await db.select({ c: communityPosts.communityId }).from(communityPosts).where(eq(communityPosts.id, p.data.postId)).limit(1)
    communityId = x?.c ?? null
  } else if (p.data.commentId) {
    const [x] = await db.select({ c: communityPosts.communityId }).from(communityComments).innerJoin(communityPosts, eq(communityComments.postId, communityPosts.id)).where(eq(communityComments.id, p.data.commentId)).limit(1)
    communityId = x?.c ?? null
  }
  if (!communityId) return { error: 'That content no longer exists.' }
  const g = await guard(communityId, 'view')
  if (!g.ok) return { error: g.error }
  const limited = await throttle(`community:report:${g.viewer.id}`, 10)
  if (limited) return limited

  const inserted = await db
    .insert(communityReports)
    .values({ communityId, reporterId: g.viewer.id, postId: p.data.postId ?? null, commentId: p.data.commentId ?? null, reason: p.data.reason, details: p.data.details ?? null })
    .onConflictDoNothing()
    .returning({ id: communityReports.id })
  if (!inserted.length) return { success: 'You already reported this. Our moderators will look at it.' }
  await notifyStaff(communityId, { type: 'report', title: `New report in ${g.community.name}`, link: `${groupHref(g.community)}?tab=moderation`, actorId: g.viewer.id })
  revalidatePath(`${groupHref(g.community)}`)
  return { success: 'Thanks. Our moderators will review this.' }
}

export async function blockUser(userId: string): Promise<ActionState> {
  const id = uuid.safeParse(userId)
  const viewer = await getViewer()
  if (!viewer) return { error: 'Please log in.' }
  if (!id.success || id.data === viewer.id) return { error: 'You cannot block that person.' }
  await db.insert(userBlocks).values({ blockerId: viewer.id, blockedId: id.data }).onConflictDoNothing()
  revalidatePath('/community', 'layout')
  return { success: 'Blocked. You will no longer see their posts or comments.' }
}

export async function unblockUser(userId: string): Promise<ActionState> {
  const id = uuid.safeParse(userId)
  const viewer = await getViewer()
  if (!viewer || !id.success) return { error: 'Please log in.' }
  await db.delete(userBlocks).where(and(eq(userBlocks.blockerId, viewer.id), eq(userBlocks.blockedId, id.data)))
  revalidatePath('/community', 'layout')
  return { success: 'Unblocked.' }
}

export async function submitAppeal(actionId: string, message: string): Promise<ActionState> {
  const p = z.object({ actionId: uuid, message: z.string().trim().min(10, 'Explain why you are appealing (at least 10 characters).').max(2000) }).safeParse({ actionId, message })
  if (!p.success) return { error: p.error.issues[0]?.message ?? 'Invalid input.' }
  const viewer = await getViewer()
  if (!viewer) return { error: 'Please log in.' }
  const [a] = await db.select().from(moderationActions).where(eq(moderationActions.id, p.data.actionId)).limit(1)
  if (!a || a.targetUserId !== viewer.id || !(APPEALABLE as readonly string[]).includes(a.action)) return { error: 'That decision cannot be appealed.' }
  const inserted = await db.insert(communityAppeals).values({ actionId: a.id, userId: viewer.id, message: p.data.message }).onConflictDoNothing().returning({ id: communityAppeals.id })
  if (!inserted.length) return { error: 'You already appealed this decision.' }
  revalidatePath('/community/appeals')
  revalidatePath('/admin/community/moderation')
  return { success: 'Appeal sent. An NTL administrator will review it.' }
}

// ---- Notifications ----------------------------------------------------------

export async function markAllNotificationsRead(): Promise<ActionState> {
  const viewer = await getViewer()
  if (!viewer) return { error: 'Please log in.' }
  await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.userId, viewer.id), sql`${notifications.readAt} is null`))
  revalidatePath('/community/notifications')
  return { success: 'All caught up.' }
}

export async function markNotificationRead(id: string): Promise<ActionState> {
  const nid = uuid.safeParse(id)
  const viewer = await getViewer()
  if (!viewer || !nid.success) return { error: 'Not found.' }
  await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.id, nid.data), eq(notifications.userId, viewer.id)))
  revalidatePath('/community/notifications')
  return { success: 'ok' }
}

/** One-tap report for a comment with a free-text note (used by comment lists). */
export async function reportComment(commentId: string, details: string): Promise<ActionState> {
  return reportContent({ commentId, reason: 'other', details })
}
