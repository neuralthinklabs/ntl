'use client'

import { useActionState, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addTaskComment, assignTask, createTask, deleteTask, updateTaskDetails, updateTaskStatus } from '@/actions/tasks'
import { TASK_PRIORITIES, TASK_PRIORITY_LABEL, TASK_STATUSES, TASK_STATUS_LABEL } from '@/lib/collab/constants'
import { Field, FormMessage, SubmitButton, fieldClass } from '@/components/admin/fields'
import { cn } from '@/lib/utils'

export type Option = { id: string; label: string }

export function NewTaskForm({ communityId, people }: { communityId: string; people: Option[] }) {
  const [state, action] = useActionState(createTask, null)
  return (
    <form action={action} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
      <input type="hidden" name="communityId" value={communityId} />
      <h3 className="text-base font-semibold text-ink sm:col-span-2">Add a task</h3>
      <Field label="Title" className="sm:col-span-2"><input name="title" required minLength={3} maxLength={200} className={fieldClass} /></Field>
      <Field label="Assign to (optional)">
        <select name="assigneeId" defaultValue="" className={fieldClass}>
          <option value="">Unassigned</option>
          {people.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Priority">
          <select name="priority" defaultValue="normal" className={fieldClass}>{TASK_PRIORITIES.map((p) => <option key={p} value={p}>{TASK_PRIORITY_LABEL[p]}</option>)}</select>
        </Field>
        <Field label="Due (optional)"><input name="dueDate" type="date" className={fieldClass} /></Field>
      </div>
      <Field label="Details (optional)" className="sm:col-span-2"><textarea name="description" rows={3} maxLength={3000} className={`${fieldClass} resize-none`} /></Field>
      <div className="sm:col-span-2 flex flex-col gap-3"><FormMessage state={state} /><div><SubmitButton pendingLabel="Adding…">Add task</SubmitButton></div></div>
    </form>
  )
}

export type TaskCardData = {
  id: string; title: string; description: string; status: string; priority: string
  dueLabel: string | null; dueInput: string; overdue: boolean; assigneeId: string | null; assigneeName: string | null
}
export type TaskCommentData = { id: string; author: string; body: string; date: string }

const PRIORITY_TONE: Record<string, string> = { high: 'bg-red-100 text-red-700', normal: 'bg-slate-100 text-slate-700', low: 'bg-slate-50 text-slate-600' }

export function TaskCard({ task, comments, people, canManage, canMove }: { task: TaskCardData; comments: TaskCommentData[]; people: Option[]; canManage: boolean; canMove: boolean }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showComments, setShowComments] = useState(false)
  const [editing, setEditing] = useState(false)
  const [comment, setComment] = useState('')
  const [f, setF] = useState({ title: task.title, description: task.description, priority: task.priority, dueDate: task.dueInput })

  function run(fn: () => Promise<{ error?: string; success?: string } | null>, after?: () => void) {
    setError(null)
    start(async () => {
      const res = await fn()
      if (res?.error) setError(res.error)
      else { after?.(); router.refresh() }
    })
  }

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-ink">{task.title}</p>
        <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium', PRIORITY_TONE[task.priority] ?? PRIORITY_TONE.normal)}>{TASK_PRIORITY_LABEL[task.priority]}</span>
      </div>
      {task.description && <p className="mt-1 whitespace-pre-wrap text-xs text-slate-600">{task.description}</p>}
      <p className="mt-2 text-xs text-slate-600">
        {task.assigneeName ?? 'Unassigned'}
        {task.dueLabel && <span className={task.overdue ? 'ml-2 font-medium text-red-700' : 'ml-2'}>· due {task.dueLabel}{task.overdue ? ' (overdue)' : ''}</span>}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {canMove && (
          <>
            <label className="sr-only" htmlFor={`st-${task.id}`}>Status</label>
            <select id={`st-${task.id}`} value={task.status} disabled={pending} onChange={(e) => run(() => updateTaskStatus(task.id, e.target.value))} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs">
              {TASK_STATUSES.map((s) => <option key={s} value={s}>{TASK_STATUS_LABEL[s]}</option>)}
            </select>
          </>
        )}
        {canManage && (
          <>
            <label className="sr-only" htmlFor={`as-${task.id}`}>Assignee</label>
            <select id={`as-${task.id}`} value={task.assigneeId ?? ''} disabled={pending} onChange={(e) => run(() => assignTask(task.id, e.target.value))} className="max-w-[9rem] rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs">
              <option value="">Unassigned</option>
              {people.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            <button type="button" onClick={() => setEditing((e) => !e)} aria-expanded={editing} className="text-xs font-medium text-brand-muted underline">{editing ? 'Cancel' : 'Edit'}</button>
            <button type="button" disabled={pending} onClick={() => window.confirm(`Delete “${task.title}”?`) && run(() => deleteTask(task.id))} className="text-xs font-medium text-red-700 underline">Delete</button>
          </>
        )}
        <button type="button" onClick={() => setShowComments((s) => !s)} aria-expanded={showComments} className="ml-auto text-xs font-medium text-slate-600 underline">{comments.length} comment{comments.length === 1 ? '' : 's'}</button>
      </div>

      {editing && (
        <form className="mt-3 flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); run(() => updateTaskDetails(task.id, f), () => setEditing(false)) }}>
          <input value={f.title} onChange={(e) => setF((s) => ({ ...s, title: e.target.value }))} required minLength={3} maxLength={200} aria-label="Title" className={fieldClass} />
          <textarea value={f.description} onChange={(e) => setF((s) => ({ ...s, description: e.target.value }))} rows={3} maxLength={3000} aria-label="Details" className={`${fieldClass} resize-none`} />
          <div className="grid grid-cols-2 gap-2">
            <select value={f.priority} onChange={(e) => setF((s) => ({ ...s, priority: e.target.value }))} aria-label="Priority" className={fieldClass}>{TASK_PRIORITIES.map((p) => <option key={p} value={p}>{TASK_PRIORITY_LABEL[p]}</option>)}</select>
            <input type="date" value={f.dueDate} onChange={(e) => setF((s) => ({ ...s, dueDate: e.target.value }))} aria-label="Due date" className={fieldClass} />
          </div>
          <div><button type="submit" disabled={pending} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-60">Save</button></div>
        </form>
      )}

      {showComments && (
        <div className="mt-3 border-t border-slate-200 pt-3">
          <ul className="flex flex-col gap-2">
            {comments.map((c) => (
              <li key={c.id} className="rounded-lg bg-slate-50 p-2 text-xs text-slate-800"><span className="font-medium text-ink">{c.author}</span> · <span className="text-slate-600">{c.date}</span><p className="mt-0.5 whitespace-pre-wrap">{c.body}</p></li>
            ))}
          </ul>
          <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); run(() => addTaskComment(task.id, comment), () => setComment('')) }}>
            <label className="sr-only" htmlFor={`tc-${task.id}`}>Comment</label>
            <input id={`tc-${task.id}`} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={3000} placeholder="Add a comment…" className={`${fieldClass} flex-1`} />
            <button type="submit" disabled={pending || !comment.trim()} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-slate-50 disabled:opacity-60">Post</button>
          </form>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
    </li>
  )
}
