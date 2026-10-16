'use server'

import { z } from 'zod'
import { and, eq, inArray, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { assignments, stories } from '@/db/schema'
import { requireTeamAction } from '@/lib/auth/admin'
import { sendEmail, escapeHtml } from '@/lib/email'
import type { ActionState } from './auth'

// What an assignee may do, and nothing more:
//  - move THEIR OWN assignment between assigned / in_progress / submitted
//  - leave a note for the admin
//  - edit THEIR OWN unpublished blog draft
// They cannot mark work "done" (admin only), reassign, publish, or touch roles.
const OPEN = ['assigned', 'in_progress', 'submitted'] as const
const noteSchema = z.string().trim().max(2000)

async function notifySubmitted(title: string, who: string) {
  const inbox = process.env.CONTACT_INBOX_EMAIL
  if (!inbox) return
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/admin/assignments`
  await sendEmail({
    to: inbox,
    subject: `Submitted for review: ${title}`.replace(/[\r\n]+/g, ' '),
    html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;line-height:1.55"><p><strong>${escapeHtml(who)}</strong> submitted "${escapeHtml(title)}".</p><p><a href="${escapeHtml(url)}">Open assignments</a></p></div>`,
  })
}

export async function updateMyAssignment(
  id: string,
  status: (typeof OPEN)[number],
  note: string,
): Promise<ActionState> {
  try {
    const { user, profile } = await requireTeamAction()
    const p = z
      .object({ id: z.string().uuid(), status: z.enum(OPEN), note: noteSchema })
      .safeParse({ id, status, note })
    if (!p.success) return { error: p.error.issues[0]?.message ?? 'Invalid input.' }

    const mine = and(eq(assignments.id, p.data.id), eq(assignments.assigneeId, user.id), inArray(assignments.status, [...OPEN]))
    const [before] = await db.select({ status: assignments.status, title: assignments.title }).from(assignments).where(mine)
    if (!before) return { error: 'This assignment is closed or is not yours.' }

    await db
      .update(assignments)
      .set({ status: p.data.status, assigneeNote: p.data.note || null, updatedAt: new Date() })
      .where(mine)

    if (p.data.status === 'submitted' && before.status !== 'submitted') {
      await notifySubmitted(before.title, profile.fullName || profile.email)
    }
    revalidatePath('/team')
    revalidatePath('/admin/assignments')
    return { success: 'Saved.' }
  } catch (e) {
    console.error('[team] update failed:', e)
    return { error: 'You do not have permission to do that.' }
  }
}

const draftSchema = z.object({
  assignmentId: z.string().uuid(),
  title: z.string().trim().min(3, 'Title must be at least 3 characters.').max(200),
  excerpt: z.string().trim().max(400).optional(),
  body: z.string().max(60000).optional(),
  intent: z.enum(['save', 'submit']),
})

export async function saveMyDraft(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const { user, profile } = await requireTeamAction()
    const parsed = draftSchema.safeParse({
      assignmentId: formData.get('assignmentId'),
      title: formData.get('title'),
      excerpt: formData.get('excerpt') || undefined,
      body: formData.get('body') || undefined,
      intent: formData.get('intent'),
    })
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
    const d = parsed.data

    const [a] = await db
      .select({ id: assignments.id, storyId: assignments.storyId, status: assignments.status, title: assignments.title })
      .from(assignments)
      .where(and(eq(assignments.id, d.assignmentId), eq(assignments.assigneeId, user.id), eq(assignments.kind, 'blog_post')))
    if (!a || !a.storyId) return { error: 'This assignment is not yours.' }
    if (a.status === 'done' || a.status === 'cancelled') return { error: 'This assignment is closed.' }

    // Only while the post is still an unpublished draft.
    const [updated] = await db
      .update(stories)
      .set({ title: d.title, excerpt: d.excerpt ?? null, body: d.body ?? '', updatedAt: new Date() })
      .where(and(eq(stories.id, a.storyId), eq(stories.authorId, user.id), isNull(stories.publishedAt)))
      .returning({ id: stories.id })
    if (!updated) return { error: 'This post is already published. Ask an admin to change it.' }

    const next = d.intent === 'submit' ? 'submitted' : a.status === 'assigned' ? 'in_progress' : a.status
    await db.update(assignments).set({ status: next, updatedAt: new Date() }).where(eq(assignments.id, a.id))

    if (d.intent === 'submit' && a.status !== 'submitted') {
      await notifySubmitted(a.title, profile.fullName || profile.email)
    }
    revalidatePath('/team')
    revalidatePath(`/team/posts/${a.id}`)
    revalidatePath('/admin/assignments')
    revalidatePath('/admin/posts')
    return { success: d.intent === 'submit' ? 'Submitted for review. An admin will publish it.' : 'Draft saved.' }
  } catch (e) {
    console.error('[team] draft save failed:', e)
    return { error: 'You do not have permission to do that.' }
  }
}
