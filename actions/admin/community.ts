'use server'

import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { communities, communityAppeals, communityComments, communityMembers, communityPosts, moderationActions } from '@/db/community-schema'
import { runAdmin } from '@/lib/admin-action'
import { logAdmin } from '@/lib/audit'
import { slugify } from '@/lib/slug'
import { normalizeNtlId } from '@/lib/ntl-id'
import { notify } from '@/lib/community/notify'
import { ATLAS_SCOPES, COMMUNITY_KINDS, VISIBILITIES, isInternalKind } from '@/lib/community/constants'
import type { ActionState } from '../auth'

const uuid = z.string().uuid()

const schema = z.object({
  id: uuid.optional(),
  name: z.string().trim().min(3, 'Name must be at least 3 characters.').max(120),
  slug: z.string().trim().max(80).optional(),
  description: z.string().trim().max(3000).optional(),
  kind: z.enum(COMMUNITY_KINDS),
  visibility: z.enum(VISIBILITIES),
  atlasScope: z.enum(ATLAS_SCOPES).optional(),
  atlasUnitId: uuid.optional(),
  goalId: uuid.optional(),
  leaderNtlId: z.string().optional(),
})

function refresh(slug?: string) {
  revalidatePath('/community')
  revalidatePath('/community/discover')
  revalidatePath('/community/groups')
  revalidatePath('/workspace')
  revalidatePath('/admin/community')
  if (slug) {
    revalidatePath(`/community/g/${slug}`)
    revalidatePath(`/workspace/${slug}`)
  }
}

export async function saveCommunity(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const f = (k: string) => (formData.get(k) as string) || undefined
    const parsed = schema.safeParse({
      id: f('id'), name: formData.get('name'), slug: f('slug'), description: f('description'),
      kind: formData.get('kind'), visibility: formData.get('visibility'),
      atlasScope: f('atlasScope'), atlasUnitId: f('atlasUnitId'), goalId: f('goalId'), leaderNtlId: f('leaderNtlId'),
    })
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
    const d = parsed.data

    // Internal kinds are always hidden spaces, and only they are (also a DB constraint).
    if (isInternalKind(d.kind) !== (d.visibility === 'internal')) {
      return { error: isInternalKind(d.kind) ? 'Departments, leadership, zone and operations spaces must be Internal.' : 'Only departments, leadership, zone and operations spaces can be Internal.' }
    }
    const slug = slugify(d.slug || d.name)
    if (!slug) return { error: 'Add a name or web address with letters or numbers.' }
    if (d.kind === 'atlas' && !d.atlasScope) return { error: 'Choose the Atlas scope (national, zone, region or city).' }

    const values = {
      slug, name: d.name, description: d.description ?? null, kind: d.kind, visibility: d.visibility,
      atlasScope: d.kind === 'atlas' ? d.atlasScope! : null,
      atlasUnitId: d.kind === 'atlas' ? (d.atlasUnitId ?? null) : null,
      goalId: d.kind === 'project' ? (d.goalId ?? null) : null,
      requirePostApproval: formData.get('requirePostApproval') === 'on',
      updatedAt: new Date(),
    }

    if (d.id) {
      const [prev] = await db.select().from(communities).where(eq(communities.id, d.id)).limit(1)
      if (!prev) return { error: 'This group no longer exists.' }
      // Changing visibility of a group that has members is allowed, but never TO public from internal by accident.
      if (prev.visibility === 'internal' && d.visibility !== 'internal') return { error: 'An internal space cannot be made public. Create a new group instead.' }
      await db.update(communities).set(values).where(eq(communities.id, d.id))
      await logAdmin({ actorId: admin.id, action: 'community_update', entity: 'community', entityId: d.id, summary: d.name })
      refresh(prev.slug)
      refresh(slug)
      revalidatePath(`/admin/community/${d.id}`)
      return { success: 'Saved.' }
    }

    let leaderId: string | null = null
    if (d.leaderNtlId) {
      const id = normalizeNtlId(d.leaderNtlId)
      if (!id) return { error: 'The leader NTL ID is not valid.' }
      const [p] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.ntlId, id)).limit(1)
      if (!p) return { error: 'No one has that leader NTL ID.' }
      leaderId = p.id
    }
    const row = await db.transaction(async (tx) => {
      const [c] = await tx.insert(communities).values({ ...values, createdBy: admin.id }).returning({ id: communities.id })
      if (leaderId) await tx.insert(communityMembers).values({ communityId: c.id, userId: leaderId, role: 'leader', status: 'active' })
      return c
    })
    await logAdmin({ actorId: admin.id, action: 'community_create', entity: 'community', entityId: row.id, summary: d.name })
    refresh(slug)
    redirect(`/admin/community/${row.id}?created=1`)
  })
}

export async function setCommunityArchived(id: string, archived: boolean): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const cid = uuid.parse(id)
    const [c] = await db.update(communities).set({ archivedAt: archived ? new Date() : null, updatedAt: new Date() }).where(eq(communities.id, cid)).returning({ slug: communities.slug, name: communities.name })
    await logAdmin({ actorId: admin.id, action: archived ? 'community_archive' : 'community_unarchive', entity: 'community', entityId: cid, summary: c?.name })
    refresh(c?.slug)
    return { success: archived ? 'Archived. It is now read-only and hidden from Discover.' : 'Restored.' }
  })
}

// ---- Platform-level actions on a person ------------------------------------

const personSchema = z.object({
  ntlId: z.string(),
  action: z.enum(['verify', 'unverify', 'suspend', 'ban', 'lift']),
  days: z.coerce.number().int().min(1).max(365).optional(),
  reason: z.string().trim().max(500).optional(),
})

export async function personAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const parsed = personSchema.safeParse({ ntlId: formData.get('ntlId'), action: formData.get('action'), days: formData.get('days') || undefined, reason: formData.get('reason') || undefined })
    if (!parsed.success) return { error: 'Check the NTL ID and the action.' }
    const d = parsed.data
    const ntl = normalizeNtlId(d.ntlId)
    if (!ntl) return { error: 'Enter a valid NTL ID (like NTL-7K3M-9QX2).' }
    const [p] = await db.select({ id: profiles.id, role: profiles.role }).from(profiles).where(eq(profiles.ntlId, ntl)).limit(1)
    if (!p) return { error: 'No one has that NTL ID.' }
    if (p.id === admin.id) return { error: 'You cannot do that to yourself.' }
    if (p.role === 'admin' && ['suspend', 'ban'].includes(d.action)) return { error: 'Admins cannot be suspended or banned here.' }

    const log = (action: (typeof moderationActions.$inferInsert)['action'], expiresAt?: Date) =>
      db.insert(moderationActions).values({ actorId: admin.id, targetUserId: p.id, action, reason: d.reason ?? null, expiresAt: expiresAt ?? null })

    if (d.action === 'verify' || d.action === 'unverify') {
      await db.update(profiles).set({ verifiedContributor: d.action === 'verify', updatedAt: new Date() }).where(eq(profiles.id, p.id))
    } else if (d.action === 'suspend') {
      if (!d.days) return { error: 'Choose how many days.' }
      if (!d.reason || d.reason.length < 3) return { error: 'Give a reason.' }
      const until = new Date(Date.now() + d.days * 86_400_000)
      await db.update(profiles).set({ communitySuspendedUntil: until, updatedAt: new Date() }).where(eq(profiles.id, p.id))
      await log('global_suspend', until)
      await notify([{ userId: p.id, type: 'suspension', title: `Your community access is suspended for ${d.days} days`, body: d.reason, link: '/community/appeals', actorId: admin.id }])
    } else if (d.action === 'ban') {
      if (!d.reason || d.reason.length < 3) return { error: 'Give a reason.' }
      await db.update(profiles).set({ communityBanned: true, updatedAt: new Date() }).where(eq(profiles.id, p.id))
      await log('global_ban')
      await notify([{ userId: p.id, type: 'ban', title: 'Your community access was removed', body: d.reason, link: '/community/appeals', actorId: admin.id }])
    } else {
      await db.update(profiles).set({ communityBanned: false, communitySuspendedUntil: null, updatedAt: new Date() }).where(eq(profiles.id, p.id))
      await log('global_unban')
    }
    await logAdmin({ actorId: admin.id, action: `community_person_${d.action}`, entity: 'profile', entityId: p.id, summary: ntl })
    revalidatePath('/admin/community/moderation')
    return { success: 'Done.' }
  })
}

// ---- Appeals ------------------------------------------------------------------

/** Admin decides appeals so a moderator never reviews their own decision. */
export async function decideAppeal(appealId: string, overturn: boolean, note: string): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const id = uuid.parse(appealId)
    const n = z.string().trim().min(3, 'Write a short note the person will see.').max(1000).safeParse(note ?? '')
    if (!n.success) return { error: n.error.issues[0]?.message ?? 'Add a note.' }

    const done = await db.transaction(async (tx) => {
      const [ap] = await tx.update(communityAppeals).set({ status: overturn ? 'overturned' : 'upheld', decidedBy: admin.id, decisionNote: n.data, decidedAt: new Date() }).where(and(eq(communityAppeals.id, id), eq(communityAppeals.status, 'pending'))).returning()
      if (!ap) return null
      const [a] = await tx.select().from(moderationActions).where(eq(moderationActions.id, ap.actionId)).limit(1)
      if (overturn && a) {
        // Reverse the effect of the original decision.
        if (a.action === 'remove_post' && a.postId) await tx.update(communityPosts).set({ status: 'published', removedReason: null }).where(eq(communityPosts.id, a.postId))
        if (a.action === 'remove_comment' && a.commentId) await tx.update(communityComments).set({ status: 'published' }).where(eq(communityComments.id, a.commentId))
        if ((a.action === 'suspend' || a.action === 'ban') && a.communityId && a.targetUserId) {
          if (a.action === 'ban') await tx.delete(communityMembers).where(and(eq(communityMembers.communityId, a.communityId), eq(communityMembers.userId, a.targetUserId), eq(communityMembers.status, 'banned')))
          else await tx.update(communityMembers).set({ status: 'active', suspendedUntil: null }).where(and(eq(communityMembers.communityId, a.communityId), eq(communityMembers.userId, a.targetUserId), eq(communityMembers.status, 'suspended')))
        }
        if (a.action === 'global_ban' && a.targetUserId) await tx.update(profiles).set({ communityBanned: false }).where(eq(profiles.id, a.targetUserId))
        if (a.action === 'global_suspend' && a.targetUserId) await tx.update(profiles).set({ communitySuspendedUntil: null }).where(eq(profiles.id, a.targetUserId))
      }
      await tx.insert(moderationActions).values({ communityId: a?.communityId ?? null, actorId: admin.id, targetUserId: ap.userId, postId: a?.postId ?? null, commentId: a?.commentId ?? null, action: overturn ? 'appeal_overturned' : 'appeal_upheld', reason: n.data })
      return ap
    })
    if (!done) return { error: 'This appeal was already decided.' }
    await notify([{ userId: done.userId, type: 'appeal_decision', title: overturn ? 'Your appeal was accepted' : 'Your appeal was reviewed', body: n.data, link: '/community/appeals', actorId: admin.id }])
    await logAdmin({ actorId: admin.id, action: overturn ? 'appeal_overturned' : 'appeal_upheld', entity: 'appeal', entityId: id })
    revalidatePath('/admin/community/moderation')
    revalidatePath('/community/appeals')
    revalidatePath('/community')
    return { success: overturn ? 'Decision reversed and the person was told.' : 'Appeal rejected and the person was told.' }
  })
}
