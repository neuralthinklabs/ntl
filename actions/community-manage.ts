'use server'

import { z } from 'zod'
import { and, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { communityComments, communityMembers, communityPosts, communityReports, moderationActions } from '@/db/community-schema'
import { guard, getMembership, type Community, type Viewer } from '@/lib/community/authz'
import { notify } from '@/lib/community/notify'
import { MEMBER_ROLES, groupHref } from '@/lib/community/constants'
import { normalizeNtlId } from '@/lib/ntl-id'
import type { ActionState } from './auth'

// Group-level management. Every function re-checks the caller's role IN THAT
// GROUP (moderate = leader or moderator or admin; lead = leader or admin), and
// every moderation decision is written to moderation_actions.

const uuid = z.string().uuid()
const reasonSchema = z.string().trim().max(500)

type Log = {
  communityId: string
  actorId: string
  targetUserId?: string | null
  postId?: string | null
  commentId?: string | null
  action: (typeof moderationActions.$inferInsert)['action']
  reason?: string
  expiresAt?: Date | null
}

async function log(l: Log) {
  const [row] = await db
    .insert(moderationActions)
    .values({ communityId: l.communityId, actorId: l.actorId, targetUserId: l.targetUserId ?? null, postId: l.postId ?? null, commentId: l.commentId ?? null, action: l.action, reason: l.reason || null, expiresAt: l.expiresAt ?? null })
    .returning({ id: moderationActions.id })
  return row.id
}

function refresh(c: Pick<Community, 'slug' | 'visibility'>, extra?: string) {
  revalidatePath(groupHref(c))
  revalidatePath('/community')
  revalidatePath('/community/groups')
  revalidatePath('/admin/community/moderation')
  if (extra) revalidatePath(extra)
}

/** A moderator cannot act on someone of equal or higher standing unless they are a leader or admin. */
async function canActOn(g: { viewer: Viewer; access: { canLead: boolean }; community: Community }, targetId: string) {
  if (targetId === g.viewer.id) return { ok: false as const, error: 'You cannot take moderation action against yourself.' }
  const t = await getMembership(g.community.id, targetId)
  if (t && t.role !== 'member' && !g.access.canLead) return { ok: false as const, error: 'Only a group leader can act on a moderator or leader.' }
  return { ok: true as const, target: t }
}

// ---- Join requests and roster ----------------------------------------------

export async function approveMember(communityId: string, userId: string): Promise<ActionState> {
  const g = await guard(communityId, 'moderate')
  if (!g.ok) return { error: g.error }
  if (!uuid.safeParse(userId).success) return { error: 'Person not found.' }
  const updated = await db
    .update(communityMembers)
    .set({ status: 'active' })
    .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId), eq(communityMembers.status, 'pending')))
    .returning({ u: communityMembers.userId })
  if (!updated.length) return { error: 'That request is no longer pending.' }
  await notify([{ userId, type: 'join_approved', title: `You are in: ${g.community.name}`, link: groupHref(g.community), actorId: g.viewer.id }])
  refresh(g.community)
  return { success: 'Approved.' }
}

export async function rejectMember(communityId: string, userId: string): Promise<ActionState> {
  const g = await guard(communityId, 'moderate')
  if (!g.ok) return { error: g.error }
  if (!uuid.safeParse(userId).success) return { error: 'Person not found.' }
  await db.delete(communityMembers).where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId), eq(communityMembers.status, 'pending')))
  refresh(g.community)
  return { success: 'Request declined.' }
}

/** Invite by NTL ID. The only way into an internal group. */
export async function addMember(communityId: string, ntlId: string, role: string): Promise<ActionState> {
  const g = await guard(communityId, 'lead')
  if (!g.ok) return { error: g.error }
  const r = z.enum(MEMBER_ROLES).safeParse(role)
  const id = normalizeNtlId(ntlId)
  if (!r.success || !id) return { error: 'Enter a valid NTL ID (like NTL-7K3M-9QX2) and a role.' }
  const [p] = await db.select({ id: profiles.id, banned: profiles.communityBanned }).from(profiles).where(eq(profiles.ntlId, id)).limit(1)
  if (!p) return { error: 'No one has that NTL ID.' }
  if (p.banned) return { error: 'That person is banned from the community platform.' }
  const existing = await getMembership(communityId, p.id)
  if (existing?.status === 'banned') return { error: 'That person is banned from this group. Lift the ban first.' }
  await db
    .insert(communityMembers)
    .values({ communityId, userId: p.id, role: r.data, status: 'active' })
    .onConflictDoUpdate({ target: [communityMembers.communityId, communityMembers.userId], set: { role: r.data, status: 'active', suspendedUntil: null } })
  await log({ communityId, actorId: g.viewer.id, targetUserId: p.id, action: 'role_change', reason: `Added as ${r.data}` })
  await notify([{ userId: p.id, type: 'role_changed', title: `You were added to ${g.community.name} as ${r.data}`, link: groupHref(g.community), actorId: g.viewer.id }])
  refresh(g.community)
  return { success: 'Added.' }
}

export async function setMemberRole(communityId: string, userId: string, role: string): Promise<ActionState> {
  const g = await guard(communityId, 'lead')
  if (!g.ok) return { error: g.error }
  const r = z.enum(MEMBER_ROLES).safeParse(role)
  if (!r.success || !uuid.safeParse(userId).success) return { error: 'Invalid role.' }
  const t = await getMembership(communityId, userId)
  if (!t || t.status !== 'active') return { error: 'Only active members can be given a role.' }
  if (t.role === 'leader' && r.data !== 'leader') {
    const [n] = await db.select({ n: sql<number>`count(*)::int` }).from(communityMembers).where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.role, 'leader'), eq(communityMembers.status, 'active')))
    if ((n?.n ?? 0) <= 1) return { error: 'A group needs at least one leader. Make someone else a leader first.' }
  }
  await db.update(communityMembers).set({ role: r.data }).where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)))
  await log({ communityId, actorId: g.viewer.id, targetUserId: userId, action: 'role_change', reason: `Role set to ${r.data}` })
  await notify([{ userId, type: 'role_changed', title: `Your role in ${g.community.name} is now ${r.data}`, link: groupHref(g.community), actorId: g.viewer.id }])
  refresh(g.community)
  return { success: 'Role updated.' }
}

export async function removeMember(communityId: string, userId: string, reason: string): Promise<ActionState> {
  const g = await guard(communityId, 'moderate')
  if (!g.ok) return { error: g.error }
  if (!uuid.safeParse(userId).success) return { error: 'Person not found.' }
  const can = await canActOn(g, userId)
  if (!can.ok) return { error: can.error }
  if (!can.target) return { error: 'That person is not in this group.' }
  await db.delete(communityMembers).where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)))
  await log({ communityId, actorId: g.viewer.id, targetUserId: userId, action: 'remove_member', reason: reasonSchema.parse(reason ?? '') })
  await notify([{ userId, type: 'warning', title: `You were removed from ${g.community.name}`, body: reason || undefined, link: '/community/appeals', actorId: g.viewer.id }])
  refresh(g.community)
  return { success: 'Removed from the group.' }
}

// ---- Warnings, suspensions, bans -------------------------------------------

export async function warnMember(communityId: string, userId: string, reason: string): Promise<ActionState> {
  const g = await guard(communityId, 'moderate')
  if (!g.ok) return { error: g.error }
  if (!uuid.safeParse(userId).success) return { error: 'Person not found.' }
  const r = reasonSchema.min(3, 'Give a short reason so the person understands.').safeParse(reason ?? '')
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Give a reason.' }
  const can = await canActOn(g, userId)
  if (!can.ok) return { error: can.error }
  await log({ communityId, actorId: g.viewer.id, targetUserId: userId, action: 'warn', reason: r.data })
  await notify([{ userId, type: 'warning', title: `Warning from ${g.community.name}`, body: r.data, link: '/community/appeals', actorId: g.viewer.id }])
  refresh(g.community)
  return { success: 'Warning sent and logged.' }
}

export async function suspendMember(communityId: string, userId: string, days: number, reason: string): Promise<ActionState> {
  const g = await guard(communityId, 'moderate')
  if (!g.ok) return { error: g.error }
  const p = z.object({ userId: uuid, days: z.number().int().min(1).max(90), reason: reasonSchema.min(3, 'Give a short reason.') }).safeParse({ userId, days, reason: reason ?? '' })
  if (!p.success) return { error: p.error.issues[0]?.message ?? 'Invalid input.' }
  const can = await canActOn(g, p.data.userId)
  if (!can.ok) return { error: can.error }
  if (!can.target) return { error: 'That person is not in this group.' }
  const until = new Date(Date.now() + p.data.days * 86_400_000)
  await db.update(communityMembers).set({ status: 'suspended', suspendedUntil: until }).where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, p.data.userId)))
  await log({ communityId, actorId: g.viewer.id, targetUserId: p.data.userId, action: 'suspend', reason: p.data.reason, expiresAt: until })
  await notify([{ userId: p.data.userId, type: 'suspension', title: `You are suspended from ${g.community.name} for ${p.data.days} day${p.data.days === 1 ? '' : 's'}`, body: p.data.reason, link: '/community/appeals', actorId: g.viewer.id }])
  refresh(g.community)
  return { success: `Suspended for ${p.data.days} days.` }
}

export async function banMember(communityId: string, userId: string, reason: string): Promise<ActionState> {
  const g = await guard(communityId, 'moderate')
  if (!g.ok) return { error: g.error }
  const p = z.object({ userId: uuid, reason: reasonSchema.min(3, 'Give a short reason.') }).safeParse({ userId, reason: reason ?? '' })
  if (!p.success) return { error: p.error.issues[0]?.message ?? 'Invalid input.' }
  const can = await canActOn(g, p.data.userId)
  if (!can.ok) return { error: can.error }
  // Works for non-members of public groups too: the ban row blocks posting and rejoining.
  await db
    .insert(communityMembers)
    .values({ communityId, userId: p.data.userId, role: 'member', status: 'banned' })
    .onConflictDoUpdate({ target: [communityMembers.communityId, communityMembers.userId], set: { status: 'banned', role: 'member', suspendedUntil: null } })
  await log({ communityId, actorId: g.viewer.id, targetUserId: p.data.userId, action: 'ban', reason: p.data.reason })
  await notify([{ userId: p.data.userId, type: 'ban', title: `You were banned from ${g.community.name}`, body: p.data.reason, link: '/community/appeals', actorId: g.viewer.id }])
  refresh(g.community)
  return { success: 'Banned.' }
}

export async function liftRestriction(communityId: string, userId: string): Promise<ActionState> {
  const g = await guard(communityId, 'moderate')
  if (!g.ok) return { error: g.error }
  if (!uuid.safeParse(userId).success) return { error: 'Person not found.' }
  const t = await getMembership(communityId, userId)
  if (!t || (t.status !== 'banned' && t.status !== 'suspended')) return { error: 'No restriction to lift.' }
  // Lifting a ban removes the ban row (the person may rejoin); lifting a suspension reactivates them.
  if (t.status === 'banned') await db.delete(communityMembers).where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)))
  else await db.update(communityMembers).set({ status: 'active', suspendedUntil: null }).where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)))
  await log({ communityId, actorId: g.viewer.id, targetUserId: userId, action: 'unban' })
  refresh(g.community)
  return { success: 'Restriction lifted.' }
}

// ---- Content moderation -----------------------------------------------------

async function postContext(postId: string) {
  if (!uuid.safeParse(postId).success) return null
  const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, postId)).limit(1)
  return post ?? null
}

export async function approvePost(postId: string): Promise<ActionState> {
  const post = await postContext(postId)
  if (!post) return { error: 'Post not found.' }
  const g = await guard(post.communityId, 'moderate')
  if (!g.ok) return { error: g.error }
  const updated = await db.update(communityPosts).set({ status: 'published', updatedAt: new Date() }).where(and(eq(communityPosts.id, post.id), eq(communityPosts.status, 'pending'))).returning({ id: communityPosts.id })
  if (!updated.length) return { error: 'This post is no longer waiting for approval.' }
  await log({ communityId: post.communityId, actorId: g.viewer.id, targetUserId: post.authorId, postId: post.id, action: 'approve_post' })
  if (post.authorId) await notify([{ userId: post.authorId, type: 'post_approved', title: `Your post in ${g.community.name} was approved`, link: `/community/post/${post.id}`, actorId: g.viewer.id }])
  refresh(g.community, `/community/post/${post.id}`)
  return { success: 'Approved and published.' }
}

export async function removePost(postId: string, reason: string): Promise<ActionState> {
  const post = await postContext(postId)
  if (!post) return { error: 'Post not found.' }
  const g = await guard(post.communityId, 'moderate')
  if (!g.ok) return { error: g.error }
  const r = reasonSchema.min(3, 'Give a short reason so the author understands.').safeParse(reason ?? '')
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Give a reason.' }
  await db.update(communityPosts).set({ status: 'removed', removedReason: r.data, updatedAt: new Date() }).where(eq(communityPosts.id, post.id))
  // Removing content settles every open report about it.
  await db.update(communityReports).set({ status: 'resolved', handledBy: g.viewer.id, handledAt: new Date(), handlerNote: 'Content removed' }).where(and(eq(communityReports.postId, post.id), eq(communityReports.status, 'open')))
  await log({ communityId: post.communityId, actorId: g.viewer.id, targetUserId: post.authorId, postId: post.id, action: 'remove_post', reason: r.data })
  if (post.authorId) await notify([{ userId: post.authorId, type: 'post_removed', title: `Your post in ${g.community.name} was removed`, body: r.data, link: '/community/appeals', actorId: g.viewer.id }])
  refresh(g.community, `/community/post/${post.id}`)
  return { success: 'Post removed and logged.' }
}

export async function restorePost(postId: string): Promise<ActionState> {
  const post = await postContext(postId)
  if (!post) return { error: 'Post not found.' }
  const g = await guard(post.communityId, 'moderate')
  if (!g.ok) return { error: g.error }
  await db.update(communityPosts).set({ status: 'published', removedReason: null, updatedAt: new Date() }).where(and(eq(communityPosts.id, post.id), eq(communityPosts.status, 'removed')))
  await log({ communityId: post.communityId, actorId: g.viewer.id, targetUserId: post.authorId, postId: post.id, action: 'restore_post' })
  refresh(g.community, `/community/post/${post.id}`)
  return { success: 'Post restored.' }
}

export async function setPinned(postId: string, pinned: boolean): Promise<ActionState> {
  const post = await postContext(postId)
  if (!post) return { error: 'Post not found.' }
  const g = await guard(post.communityId, 'moderate')
  if (!g.ok) return { error: g.error }
  await db.update(communityPosts).set({ pinned }).where(eq(communityPosts.id, post.id))
  refresh(g.community)
  return { success: pinned ? 'Pinned.' : 'Unpinned.' }
}

export async function removeComment(commentId: string, reason: string): Promise<ActionState> {
  if (!uuid.safeParse(commentId).success) return { error: 'Comment not found.' }
  const [c] = await db.select({ id: communityComments.id, authorId: communityComments.authorId, postId: communityComments.postId, communityId: communityPosts.communityId }).from(communityComments).innerJoin(communityPosts, eq(communityComments.postId, communityPosts.id)).where(eq(communityComments.id, commentId)).limit(1)
  if (!c) return { error: 'Comment not found.' }
  const g = await guard(c.communityId, 'moderate')
  if (!g.ok) return { error: g.error }
  const r = reasonSchema.min(3, 'Give a short reason.').safeParse(reason ?? '')
  if (!r.success) return { error: r.error.issues[0]?.message ?? 'Give a reason.' }
  await db.update(communityComments).set({ status: 'removed' }).where(eq(communityComments.id, c.id))
  await db.update(communityReports).set({ status: 'resolved', handledBy: g.viewer.id, handledAt: new Date(), handlerNote: 'Content removed' }).where(and(eq(communityReports.commentId, c.id), eq(communityReports.status, 'open')))
  await log({ communityId: c.communityId, actorId: g.viewer.id, targetUserId: c.authorId, commentId: c.id, action: 'remove_comment', reason: r.data })
  if (c.authorId) await notify([{ userId: c.authorId, type: 'post_removed', title: `Your comment in ${g.community.name} was removed`, body: r.data, link: '/community/appeals', actorId: g.viewer.id }])
  refresh(g.community, `/community/post/${c.postId}`)
  return { success: 'Comment removed and logged.' }
}

export async function closeReport(reportId: string, outcome: 'resolved' | 'dismissed', note: string): Promise<ActionState> {
  if (!uuid.safeParse(reportId).success) return { error: 'Report not found.' }
  const [rep] = await db.select().from(communityReports).where(eq(communityReports.id, reportId)).limit(1)
  if (!rep) return { error: 'Report not found.' }
  const g = await guard(rep.communityId, 'moderate')
  if (!g.ok) return { error: g.error }
  const updated = await db.update(communityReports).set({ status: outcome, handledBy: g.viewer.id, handledAt: new Date(), handlerNote: reasonSchema.parse(note ?? '') || null }).where(and(eq(communityReports.id, rep.id), eq(communityReports.status, 'open'))).returning({ id: communityReports.id })
  if (!updated.length) return { error: 'This report was already handled.' }
  await log({ communityId: rep.communityId, actorId: g.viewer.id, postId: rep.postId, commentId: rep.commentId, action: outcome === 'resolved' ? 'report_resolved' : 'report_dismissed', reason: note || undefined })
  refresh(g.community)
  return { success: outcome === 'resolved' ? 'Report resolved.' : 'Report dismissed.' }
}
