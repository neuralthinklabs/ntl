'use server'

import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { communityComments, communityPosts } from '@/db/community-schema'
import { postAttachments } from '@/db/collab-schema'
import { guard } from '@/lib/community/authz'
import { notifyStaff } from '@/lib/community/notify'
import { groupHref } from '@/lib/community/constants'
import { throttle } from '@/lib/collab/throttle'
import { removeUploads } from '@/lib/collab/uploads'
import type { ActionState } from './auth'

const uuid = z.string().uuid()
const LINK_TYPES = ['resource', 'research', 'event', 'project_update']
const link = z.string().trim().max(500).url('Enter a valid link.').refine((u) => u.startsWith('https://'), 'Links must start with https://')

function refresh(c: { slug: string; visibility: string }, postId: string) {
  revalidatePath('/community')
  revalidatePath(groupHref(c))
  revalidatePath(`/community/post/${postId}`)
}

/**
 * Authors can edit their own post's text. If the group needs approval and the author
 * is not staff or verified, an edit sends the post back to the queue so approval
 * cannot be dodged by editing after the fact.
 */
export async function editPost(postId: string, input: { title: string; body: string; linkUrl: string }): Promise<ActionState> {
  const p = z
    .object({ postId: uuid, title: z.string().trim().max(200), body: z.string().trim().min(3, 'Write something first.').max(10000), linkUrl: link.optional() })
    .safeParse({ postId, title: input?.title ?? '', body: input?.body ?? '', linkUrl: input?.linkUrl?.trim() || undefined })
  if (!p.success) return { error: p.error.issues[0]?.message ?? 'Invalid input.' }
  const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, p.data.postId)).limit(1)
  if (!post) return { error: 'Post not found.' }
  const g = await guard(post.communityId, 'post')
  if (!g.ok) return { error: g.error }
  if (post.authorId !== g.viewer.id) return { error: 'You can only edit your own posts.' }
  if (post.status === 'removed') return { error: 'This post was removed.' }
  if (post.type !== 'discussion' && p.data.title.length < 3) return { error: 'Add a title (at least 3 characters).' }
  const takesLink = LINK_TYPES.includes(post.type)
  if (post.type === 'resource' && !p.data.linkUrl) return { error: 'Add the link to the resource.' }
  const limited = await throttle(`community:edit:${g.viewer.id}`, 30)
  if (limited) return limited

  const needsApproval = g.community.requirePostApproval && !g.access.canModerate && !g.viewer.verified
  const status = needsApproval ? 'pending' : post.status
  await db
    .update(communityPosts)
    .set({ title: p.data.title || null, body: p.data.body, linkUrl: takesLink ? (p.data.linkUrl ?? null) : post.linkUrl, status, editedAt: new Date(), updatedAt: new Date() })
    .where(eq(communityPosts.id, post.id))
  if (needsApproval && post.status === 'published') {
    await notifyStaff(g.community.id, { type: 'post_pending', title: `An edited post in ${g.community.name} is waiting for approval`, link: `${groupHref(g.community)}?tab=moderation`, actorId: g.viewer.id })
  }
  refresh(g.community, post.id)
  return { success: needsApproval ? 'Saved. A moderator will approve the edit.' : 'Saved.' }
}

/** Authors can take down their own post. It is hidden for everyone; staff can still see it. */
export async function deleteOwnPost(postId: string): Promise<ActionState> {
  if (!uuid.safeParse(postId).success) return { error: 'Post not found.' }
  const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, postId)).limit(1)
  if (!post) return { error: 'Post not found.' }
  const g = await guard(post.communityId, 'view')
  if (!g.ok) return { error: g.error }
  if (post.authorId !== g.viewer.id) return { error: 'You can only delete your own posts.' }
  await db.update(communityPosts).set({ status: 'removed', removedReason: 'Deleted by the author', updatedAt: new Date() }).where(and(eq(communityPosts.id, post.id), eq(communityPosts.authorId, g.viewer.id)))
  const files = await db.select({ path: postAttachments.storagePath }).from(postAttachments).where(eq(postAttachments.postId, post.id))
  await removeUploads(files.map((f) => f.path))
  await db.delete(postAttachments).where(eq(postAttachments.postId, post.id))
  refresh(g.community, post.id)
  return { success: 'Post deleted.' }
}

export async function deleteOwnComment(commentId: string): Promise<ActionState> {
  if (!uuid.safeParse(commentId).success) return { error: 'Comment not found.' }
  const [c] = await db
    .select({ id: communityComments.id, authorId: communityComments.authorId, postId: communityComments.postId, communityId: communityPosts.communityId })
    .from(communityComments)
    .innerJoin(communityPosts, eq(communityComments.postId, communityPosts.id))
    .where(eq(communityComments.id, commentId))
    .limit(1)
  if (!c) return { error: 'Comment not found.' }
  const g = await guard(c.communityId, 'view')
  if (!g.ok) return { error: g.error }
  if (c.authorId !== g.viewer.id) return { error: 'You can only delete your own comments.' }
  await db.update(communityComments).set({ status: 'removed' }).where(eq(communityComments.id, c.id))
  refresh(g.community, c.postId)
  return { success: 'Comment deleted.' }
}
