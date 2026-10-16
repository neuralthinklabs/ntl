'use server'

import { z } from 'zod'
import { and, eq, inArray, ne } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { assignments, problems, profiles, stories } from '@/db/schema'
import { runAdmin } from '@/lib/admin-action'
import { logAdmin } from '@/lib/audit'
import { sendEmail, escapeHtml } from '@/lib/email'
import { ASSIGNABLE_ROLES } from '@/lib/roles'
import { slugify } from '@/lib/slug'
import type { ActionState } from '../auth'

const uuid = z.string().uuid()

const toDate = (v: FormDataEntryValue | null) => {
  const s = typeof v === 'string' ? v.trim() : ''
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00:00Z`) : null
}

function refresh() {
  revalidatePath('/admin/assignments')
  revalidatePath('/admin/assignments/problems')
  revalidatePath('/admin')
  revalidatePath('/team')
}

/** Every id must be a real volunteer / core-team member. */
async function loadAssignees(ids: string[]) {
  const rows = await db
    .select({ id: profiles.id, email: profiles.email })
    .from(profiles)
    .where(and(inArray(profiles.id, ids), inArray(profiles.role, ASSIGNABLE_ROLES as unknown as ('volunteer' | 'core_team')[])))
  return rows.length === ids.length ? rows : null
}

async function notifyAssignee(to: string, subject: string, body: string) {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/team`
  await sendEmail({
    to,
    subject,
    html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;line-height:1.55;color:#0d0f12"><p>${escapeHtml(body)}</p><p><a href="${escapeHtml(url)}">Open your workspace</a></p><p style="color:#555">Neural Think Labs</p></div>`,
  })
}

// ---- Problems: assign to one person, or split evenly between several -------

export async function assignProblems(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const ids = z.array(uuid).min(1, 'Select at least one problem.').max(200).safeParse(formData.getAll('problemId'))
    if (!ids.success) return { error: ids.error.issues[0]?.message ?? 'Select at least one problem.' }

    const split = formData.get('mode') === 'split'
    const raw = (split ? formData.getAll('splitAmong') : [formData.get('assignee')]).filter(Boolean)
    const people = z
      .array(uuid)
      .min(1, split ? 'Choose at least one person to split between.' : 'Choose who to assign to.')
      .safeParse(raw)
    if (!people.success) return { error: people.error.issues[0]?.message ?? 'Choose who to assign to.' }

    const list = [...new Set(people.data)]
    const assignees = await loadAssignees(list)
    if (!assignees) return { error: 'Only volunteers and core-team members can be assigned work.' }

    const due = toDate(formData.get('dueDate'))
    const brief = String(formData.get('brief') ?? '').trim().slice(0, 2000) || null

    const found = await db.select({ id: problems.id, title: problems.title }).from(problems).where(inArray(problems.id, ids.data))
    const taken = await db
      .select({ id: assignments.problemId })
      .from(assignments)
      .where(and(eq(assignments.kind, 'problem_review'), inArray(assignments.problemId, ids.data), ne(assignments.status, 'cancelled')))
    const takenIds = new Set(taken.map((t) => t.id))
    const todo = found.filter((p) => !takenIds.has(p.id))
    if (!todo.length) return { error: 'Those problems are already assigned to someone.' }

    // Round-robin keeps the split even: 50 problems over 5 people = 10 each.
    const inserted = await db
      .insert(assignments)
      .values(
        todo.map((p, i) => ({
          kind: 'problem_review' as const,
          assigneeId: list[i % list.length],
          assignedBy: admin.id,
          problemId: p.id,
          title: `Review: ${p.title}`.slice(0, 300),
          brief,
          dueDate: due,
        })),
      )
      .onConflictDoNothing()
      .returning({ assigneeId: assignments.assigneeId })

    const perPerson = new Map<string, number>()
    for (const r of inserted) perPerson.set(r.assigneeId, (perPerson.get(r.assigneeId) ?? 0) + 1)
    for (const a of assignees) {
      const n = perPerson.get(a.id)
      if (n && a.email) {
        await notifyAssignee(a.email, `You have ${n} new problem${n === 1 ? '' : 's'} to review`, `An admin assigned you ${n} problem${n === 1 ? '' : 's'} to review.`)
      }
    }

    await logAdmin({
      actorId: admin.id,
      action: 'assign_problems',
      entity: 'assignment',
      summary: `${inserted.length} problem(s) to ${list.length} person(s)`,
    })
    refresh()

    const skipped = ids.data.length - inserted.length
    return {
      success: `Assigned ${inserted.length} problem${inserted.length === 1 ? '' : 's'} to ${list.length} ${list.length === 1 ? 'person' : 'people'}.${skipped > 0 ? ` ${skipped} skipped (already assigned).` : ''}`,
    }
  })
}

// ---- Blog: creates a draft the writer fills in -----------------------------

const blogSchema = z.object({
  assignee: uuid,
  title: z.string().trim().min(3, 'Give the topic or working title.').max(200),
  brief: z.string().trim().max(3000).optional(),
})

export async function createBlogAssignment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const parsed = blogSchema.safeParse({
      assignee: formData.get('assignee'),
      title: formData.get('title'),
      brief: formData.get('brief') || undefined,
    })
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' }
    const d = parsed.data

    const writer = await loadAssignees([d.assignee])
    if (!writer) return { error: 'Only volunteers and core-team members can be assigned work.' }

    const slug = `${slugify(d.title) || 'post'}-${crypto.randomUUID().slice(0, 6)}`
    await db.transaction(async (tx) => {
      // A private draft: published_at stays null, so it is not public until an
      // admin publishes it from Admin > Posts & stories.
      const [story] = await tx
        .insert(stories)
        .values({ slug, title: d.title, category: 'Blog', authorId: d.assignee, body: '', publishedAt: null })
        .returning({ id: stories.id })
      await tx.insert(assignments).values({
        kind: 'blog_post',
        assigneeId: d.assignee,
        assignedBy: admin.id,
        storyId: story.id,
        title: `Write: ${d.title}`.slice(0, 300),
        brief: d.brief ?? null,
        dueDate: toDate(formData.get('dueDate')),
      })
    })

    if (writer[0].email) {
      await notifyAssignee(writer[0].email, `New writing assignment: ${d.title}`, `You have been asked to write a post: "${d.title}".`)
    }
    await logAdmin({ actorId: admin.id, action: 'assign_blog', entity: 'assignment', summary: d.title })
    refresh()
    revalidatePath('/admin/posts')
    return { success: 'Writing assignment created. The writer has been emailed.' }
  })
}

// ---- Admin controls on an existing assignment ------------------------------

const statusSchema = z.enum(['assigned', 'in_progress', 'submitted', 'done', 'cancelled'])

export async function setAssignmentStatus(id: string, status: z.infer<typeof statusSchema>): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const p = z.object({ id: uuid, status: statusSchema }).parse({ id, status })
    await db.update(assignments).set({ status: p.status, updatedAt: new Date() }).where(eq(assignments.id, p.id))
    await logAdmin({ actorId: admin.id, action: 'assignment_status', entity: 'assignment', entityId: p.id, summary: p.status })
    refresh()
    return { success: 'Updated.' }
  })
}

export async function deleteAssignment(id: string): Promise<ActionState> {
  return runAdmin(async (admin) => {
    const p = uuid.parse(id)
    await db.delete(assignments).where(eq(assignments.id, p))
    await logAdmin({ actorId: admin.id, action: 'assignment_delete', entity: 'assignment', entityId: p })
    refresh()
    return { success: 'Removed.' }
  })
}
