'use client'

import { useState, useTransition } from 'react'
import {
  addMilestone,
  deleteGoalUpdate,
  deleteMilestone,
  postGoalUpdate,
  setMilestoneStatus,
} from '@/actions/admin/campaigns'
import { fieldClass } from './fields'

type Result = { error?: string; success?: string } | null

function useRun() {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const run = (fn: () => Promise<Result>, after?: () => void) => {
    setError(null)
    start(async () => {
      const res = await fn()
      if (res?.error) setError(res.error)
      else after?.()
    })
  }
  return { pending, error, run }
}

export function MilestoneEditor({
  goalId,
  milestones,
}: {
  goalId: string
  milestones: { id: string; name: string; status: string }[]
}) {
  const { pending, error, run } = useRun()
  const [name, setName] = useState('')

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-ink">Milestones</h2>
      <ul className="mt-4 flex flex-col gap-2">
        {milestones.length === 0 && <li className="text-sm text-slate-600">No milestones yet.</li>}
        {milestones.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 p-3">
            <span className="min-w-0 flex-1 text-sm text-ink">{m.name}</span>
            <label className="sr-only" htmlFor={`ms-${m.id}`}>Status of {m.name}</label>
            <select
              id={`ms-${m.id}`}
              defaultValue={m.status}
              disabled={pending}
              onChange={(e) => run(() => setMilestoneStatus(m.id, goalId, e.target.value as 'upcoming'))}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm"
            >
              <option value="upcoming">Upcoming</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
            <button
              type="button"
              disabled={pending}
              onClick={() => window.confirm(`Remove “${m.name}”?`) && run(() => deleteMilestone(m.id, goalId))}
              className="text-xs font-medium text-red-700 underline"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <form
        className="mt-4 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          run(() => addMilestone(goalId, name), () => setName(''))
        }}
      >
        <label className="sr-only" htmlFor="new-milestone">New milestone</label>
        <input id="new-milestone" value={name} onChange={(e) => setName(e.target.value)} placeholder="New milestone, e.g. Community training" className={`${fieldClass} flex-1`} />
        <button type="submit" disabled={pending} className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-60">
          Add
        </button>
      </form>
      {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
    </section>
  )
}

export function UpdatesEditor({
  goalId,
  updates,
}: {
  goalId: string
  updates: { id: string; title: string; body: string; date: string }[]
}) {
  const { pending, error, run } = useRun()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-ink">Progress updates</h2>
      <p className="mt-1 text-xs text-slate-600">Shown on the public campaign page, newest first.</p>
      <form
        className="mt-4 flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          run(() => postGoalUpdate(goalId, title, body), () => {
            setTitle('')
            setBody('')
          })
        }}
      >
        <label className="sr-only" htmlFor="upd-title">Update title</label>
        <input id="upd-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Update title" className={fieldClass} />
        <label className="sr-only" htmlFor="upd-body">Update text</label>
        <textarea id="upd-body" value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="What happened?" className={`${fieldClass} resize-none`} />
        <div>
          <button type="submit" disabled={pending} className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-60">
            Post update
          </button>
        </div>
      </form>
      {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
      <ul className="mt-5 flex flex-col gap-3">
        {updates.map((u) => (
          <li key={u.id} className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">{u.date}</p>
                <p className="text-sm font-medium text-ink">{u.title}</p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => window.confirm(`Delete “${u.title}”?`) && run(() => deleteGoalUpdate(u.id, goalId))}
                className="text-xs font-medium text-red-700 underline"
              >
                Delete
              </button>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{u.body}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
