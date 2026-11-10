import Link from 'next/link'
import { NewTaskForm, TaskCard, type TaskCardData } from './task-forms'
import { getMembers } from '@/lib/community/queries'
import { getTaskComments, getTasks } from '@/lib/collab/queries'
import { TASK_STATUSES, TASK_STATUS_LABEL } from '@/lib/collab/constants'
import { groupHref } from '@/lib/community/constants'
import { formatDate } from '@/lib/datetime'
import { cn } from '@/lib/utils'
import type { Access, Community, Viewer } from '@/lib/community/authz'

const pill = (on: boolean) => cn('rounded-full px-4 py-1.5 text-sm font-medium', on ? 'bg-ink text-white' : 'bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50')

export async function TasksTab({ community, viewer, access, mine }: { community: Community; viewer: Viewer | null; access: Access; mine: boolean }) {
  const [tasks, members] = await Promise.all([getTasks(community.id), getMembers(community.id)])
  const people = members.filter((m) => m.status === 'active').map((m) => ({ id: m.userId, label: m.name }))
  const comments = await getTaskComments(tasks.map((t) => t.id))
  const shown = mine && viewer ? tasks.filter((t) => t.assigneeId === viewer.id) : tasks
  const archived = !!community.archivedAt
  const canManage = access.canModerate && !archived
  const base = `${groupHref(community)}?tab=tasks`
  const today = new Date().toISOString().slice(0, 10)

  return (
    <section className="mt-8 flex flex-col gap-6">
      {canManage && <NewTaskForm communityId={community.id} people={people} />}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter tasks">
        <Link href={base} className={pill(!mine)}>All tasks ({tasks.length})</Link>
        <Link href={`${base}&mine=1`} className={pill(mine)}>My tasks</Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {TASK_STATUSES.map((s) => {
          const col = shown.filter((t) => t.status === s)
          return (
            <div key={s} className="rounded-2xl bg-slate-100/70 p-3">
              <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-600">{TASK_STATUS_LABEL[s]} ({col.length})</h2>
              <ul className="mt-3 flex flex-col gap-3">
                {col.length === 0 && <li className="px-1 text-xs text-slate-600">Nothing here.</li>}
                {col.map((t) => {
                  const due = t.dueDate ? t.dueDate.toISOString().slice(0, 10) : ''
                  const data: TaskCardData = {
                    id: t.id, title: t.title, description: t.description ?? '', status: t.status, priority: t.priority,
                    dueLabel: t.dueDate ? formatDate(t.dueDate) : null, dueInput: due, overdue: !!due && due < today && t.status !== 'done',
                    assigneeId: t.assigneeId, assigneeName: t.assigneeName,
                  }
                  const mineTask = !!viewer && t.assigneeId === viewer.id
                  return (
                    <TaskCard
                      key={t.id}
                      task={data}
                      people={people}
                      canManage={canManage}
                      canMove={!archived && (canManage || mineTask)}
                      comments={comments.filter((c) => c.taskId === t.id).map((c) => ({ id: c.id, author: c.author ?? 'Former member', body: c.body, date: formatDate(c.createdAt) }))}
                    />
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}
