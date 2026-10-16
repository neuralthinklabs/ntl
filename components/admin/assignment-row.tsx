'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { deleteAssignment, setAssignmentStatus } from '@/actions/admin/assignments'

const STATUSES = ['assigned', 'in_progress', 'submitted', 'done', 'cancelled'] as const
type Status = (typeof STATUSES)[number]
const LABEL: Record<Status, string> = { assigned: 'Not started', in_progress: 'In progress', submitted: 'Submitted', done: 'Done', cancelled: 'Cancelled' }

export function AssignmentRow({
  id,
  kind,
  title,
  assignee,
  status,
  note,
  due,
  postId,
}: {
  id: string
  kind: string
  title: string
  assignee: string
  status: string
  note: string | null
  due: string | null
  postId: string | null
}) {
  const [current, setCurrent] = useState<Status>(status as Status)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          <p className="mt-0.5 text-xs text-slate-600">
            {assignee} · {kind.replace('_', ' ')}
            {due ? ` · due ${due}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor={`as-${id}`}>Status</label>
          <select
            id={`as-${id}`}
            value={current}
            disabled={pending}
            onChange={(e) => {
              const next = e.target.value as Status
              const prev = current
              setCurrent(next)
              setError(null)
              start(async () => {
                const res = await setAssignmentStatus(id, next)
                if (res?.error) {
                  setCurrent(prev)
                  setError(res.error)
                }
              })
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{LABEL[s]}</option>
            ))}
          </select>
        </div>
      </div>

      {note && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-700"><span className="font-medium text-ink">Assignee note: </span>{note}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-medium">
        {postId && (
          <Link href={`/admin/posts/${postId}`} className="text-brand-muted underline">Review and publish the post</Link>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!window.confirm('Remove this assignment?')) return
            start(async () => {
              const res = await deleteAssignment(id)
              if (res?.error) setError(res.error)
            })
          }}
          className="text-red-700 underline disabled:opacity-60"
        >
          Remove
        </button>
        {error && <span role="alert" className="text-red-700">{error}</span>}
      </div>
    </div>
  )
}
