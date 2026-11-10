'use server'

import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db'
import { communityTasks, taskComments } from '@/db/collab-schema'
import { getMembership, guard } from '@/lib/community/authz'
import { notify } from '@/lib/community/notify'
import { groupHref } from '@/lib/community/constants'
import { TASK_PRIORITIES, TASK_STATUSES, hasTasks } from '@/lib/collab/constants'
import { throttle } from '@/lib/collab/throttle'
import type { ActionState } from './auth'

const uuid = z.string().uuid()
const toDate = (s?: string | null) => (s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(`${s}T00:00:00Z`) : null)

function refresh(c: { slug: string; visibility: string }) {
  revalidatePath(groupHref(c))
  revalidatePath('/community/tasks')
}

async function loadTask(taskId: string) {
  if (!uuid.safeParse(taskId).success) return null
  const [t] = await db.select().from(communityTasks).where(eq(communityTasks.id, taskId)).limit(1)
  return t ?? null
}

/** The assignee must be an active member of the same group. */
async function validAssignee(communityId: string, userId: string) {
  const m = await getMembership(communityId, userId)
  return !!m && m.status === 'active'
}

const createSchema = z.object({
  communityId: uuid,
  title: z.string().trim().min(3, 'Give the task a title (3+ characters).').max(200),
  description: z.string().trim().max(3000).optional(),
  assigneeId: uuid.optional(),
  priority: z.enum(TASK_PRIORITIES),
  dueDate: z.string().optional(),
})

export async function createTask(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const f = (k: string) => (formData.get(k) as string) || undefined
  const p = createSchema.safeParse({
    communityId: formData.get('communityId'), title: formData.get('title'), description: f('description'),
    assigneeId: f('assigneeId'), priority: formData.get('priority') || 'normal', dueDate: f('dueDate'),
  })
  if (!p.success) return { error: p.error.issues[0]?.message ?? 'Invalid input.' }
  const g = await guard(p.data.communityId, 'moderate')
  if (!g.ok) return { error: g.error }
  if (g.community.archivedAt) return { error: 'This group is archived.' }
  if (!hasTasks(g.community.kind)) return { error: 'This kind of group does not have a task board.' }
  const limited = await throttle(`task:create:${g.viewer.id}`, 60)
  if (limited) return limited
  if (p.data.assigneeId && !(await validAssignee(g.community.id, p.data.assigneeId))) return { error: 'You can only assign a task to an active member of this group.' }

  await db.insert(communityTasks).values({
    communityId: g.community.id, createdBy: g.viewer.id, assigneeId: p.data.assigneeId ?? null, title: p.data.title,
    description: p.data.description ?? null, priority: p.data.priority, dueDate: toDate(p.data.dueDate),
  })
  if (p.data.assigneeId) {
    await notify([{ userId: p.data.assigneeId, type: 'task_assigned', title: `New task in ${g.community.name}: ${p.data.title}`, link: `${groupHref(g.community)}?tab=tasks`, actorId: g.viewer.id }])
  }
  refresh(g.community)
  return { success: 'Task added.' }
}

/** Leaders and moderators can move any task; an assignee can move their own. */
export async function updateTaskStatus(taskId: string, status: string): Promise<ActionState> {
  const s = z.enum(TASK_STATUSES).safeParse(status)
  const t = await loadTask(taskId)
  if (!s.success || !t) return { error: 'Task not found.' }
  const g = await guard(t.communityId, 'interact')
  if (!g.ok) return { error: g.error }
  if (!g.access.canModerate && t.assigneeId !== g.viewer.id) return { error: 'Only the assignee or a group moderator can change this task.' }
  await db.update(communityTasks).set({ status: s.data, completedAt: s.data === 'done' ? new Date() : null, updatedAt: new Date() }).where(eq(communityTasks.id, t.id))
  if (t.createdBy && t.createdBy !== g.viewer.id) {
    await notify([{ userId: t.createdBy, type: 'task_update', title: `${g.viewer.name} moved "${t.title}" to ${s.data.replace('_', ' ')}`, link: `${groupHref(g.community)}?tab=tasks`, actorId: g.viewer.id }])
  }
  refresh(g.community)
  return { success: 'Updated.' }
}

/** Empty userId = unassign. */
export async function assignTask(taskId: string, userId: string): Promise<ActionState> {
  const t = await loadTask(taskId)
  if (!t) return { error: 'Task not found.' }
  const g = await guard(t.communityId, 'moderate')
  if (!g.ok) return { error: g.error }
  if (userId && (!uuid.safeParse(userId).success || !(await validAssignee(t.communityId, userId)))) return { error: 'You can only assign a task to an active member of this group.' }
  await db.update(communityTasks).set({ assigneeId: userId || null, updatedAt: new Date() }).where(eq(communityTasks.id, t.id))
  if (userId) await notify([{ userId, type: 'task_assigned', title: `Task assigned to you in ${g.community.name}: ${t.title}`, link: `${groupHref(g.community)}?tab=tasks`, actorId: g.viewer.id }])
  refresh(g.community)
  return { success: userId ? 'Assigned.' : 'Unassigned.' }
}

export async function updateTaskDetails(taskId: string, input: { title: string; description: string; priority: string; dueDate: string }): Promise<ActionState> {
  const t = await loadTask(taskId)
  if (!t) return { error: 'Task not found.' }
  const g = await guard(t.communityId, 'moderate')
  if (!g.ok) return { error: g.error }
  const p = z
    .object({ title: z.string().trim().min(3, 'Give the task a title (3+ characters).').max(200), description: z.string().trim().max(3000), priority: z.enum(TASK_PRIORITIES), dueDate: z.string() })
    .safeParse(input)
  if (!p.success) return { error: p.error.issues[0]?.message ?? 'Invalid input.' }
  await db.update(communityTasks).set({ title: p.data.title, description: p.data.description || null, priority: p.data.priority, dueDate: toDate(p.data.dueDate), updatedAt: new Date() }).where(eq(communityTasks.id, t.id))
  refresh(g.community)
  return { success: 'Saved.' }
}

export async function deleteTask(taskId: string): Promise<ActionState> {
  const t = await loadTask(taskId)
  if (!t) return { error: 'Task not found.' }
  const g = await guard(t.communityId, 'moderate')
  if (!g.ok) return { error: g.error }
  await db.delete(communityTasks).where(and(eq(communityTasks.id, t.id), eq(communityTasks.communityId, t.communityId)))
  refresh(g.community)
  return { success: 'Task deleted.' }
}

export async function addTaskComment(taskId: string, body: string): Promise<ActionState> {
  const text = z.string().trim().min(1, 'Write a comment first.').max(3000).safeParse(body ?? '')
  const t = await loadTask(taskId)
  if (!text.success || !t) return { error: text.success ? 'Task not found.' : (text.error.issues[0]?.message ?? 'Invalid comment.') }
  const g = await guard(t.communityId, 'interact')
  if (!g.ok) return { error: g.error }
  const limited = await throttle(`task:comment:${g.viewer.id}`, 40)
  if (limited) return limited
  await db.insert(taskComments).values({ taskId: t.id, authorId: g.viewer.id, body: text.data })
  const who = [...new Set([t.assigneeId, t.createdBy].filter((x): x is string => !!x))]
  await notify(who.map((userId) => ({ userId, type: 'task_update' as const, title: `${g.viewer.name} commented on "${t.title}"`, body: text.data, link: `${groupHref(g.community)}?tab=tasks`, actorId: g.viewer.id })))
  refresh(g.community)
  return { success: 'Comment added.' }
}
