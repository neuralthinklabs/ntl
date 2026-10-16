'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { updateMyAssignment } from '@/actions/team'
import { fieldClass } from '@/components/admin/fields'

export type TeamItem = {
  id: string
  kind: string
  title: string
  brief: string | null
  status: string
  note: string
  due: string | null
  problem: {
    title: string
    description: string
    category: string | null
    location: string | null
    context: string | null
    evidenceNotes: string | null
  } | null
}

const KIND: Record<string, string> = { problem_review: 'Problem review', blog_post: 'Writing', campaign: 'Campaign', event: 'Event', other: 'Task' }
const STATUS_LABEL: Record<string, string> = { assigned: 'Not started', in_progress: 'In progress', submitted: 'Submitted', done: 'Done', cancelled: 'Cancelled' }
const BADGE: Record<string, string> = {
  assigned: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-800',
  submitted: 'bg-amber-100 text-amber-800',
  done: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-slate-200 text-slate-600',
}

export function AssignmentCard({ item }: { item: TeamItem }) {
  const open = ['assigned', 'in_progress', 'submitted'].includes(item.status)
  const [status, setStatus] = useState(item.status)
  const [note, setNote] = useState(item.note)
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  function save() {
    setMsg(null)
    start(async () => {
      const res = await updateMyAssignment(item.id, status as 'assigned', note)
      if (res?.error) setMsg({ ok: false, text: res.error })
      else setMsg({ ok: true, text: res?.success ?? 'Saved.' })
    })
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-600">
            {KIND[item.kind] ?? 'Task'}
            {item.due ? ` · due ${item.due}` : ''}
          </p>
          <h3 className="mt-1 text-base font-semibold text-ink">{item.title}</h3>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${BADGE[item.status] ?? ''}`}>{STATUS_LABEL[item.status] ?? item.status}</span>
      </div>

      {item.brief && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{item.brief}</p>}

      {item.problem && (
        <details className="mt-3 rounded-lg border border-slate-200 p-3">
          <summary className="cursor-pointer text-sm font-medium text-ink">Read the problem submission</summary>
          <dl className="mt-3 flex flex-col gap-3 text-sm">
            <Row label="Description" value={item.problem.description} />
            <Row label="Category" value={item.problem.category} />
            <Row label="Location" value={item.problem.location} />
            <Row label="Background" value={item.problem.context} />
            <Row label="Evidence notes" value={item.problem.evidenceNotes} />
          </dl>
        </details>
      )}

      {item.kind === 'blog_post' && open && (
        <Link href={`/team/posts/${item.id}`} className="mt-4 inline-flex items-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90">
          Open draft
        </Link>
      )}

      {open ? (
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor={`st-${item.id}`}>Status</label>
            <select id={`st-${item.id}`} value={status} disabled={pending} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink">
              <option value="assigned">Not started</option>
              <option value="in_progress">In progress</option>
              <option value="submitted">Submitted for review</option>
            </select>
            <button type="button" disabled={pending} onClick={save} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-slate-50 disabled:opacity-60">
              {pending ? 'Saving…' : 'Save'}
            </button>
            {msg && <span role={msg.ok ? 'status' : 'alert'} className={`text-xs font-medium ${msg.ok ? 'text-brand-muted' : 'text-red-700'}`}>{msg.text}</span>}
          </div>
          <label className="sr-only" htmlFor={`nt-${item.id}`}>Note for the admin</label>
          <textarea id={`nt-${item.id}`} value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={2000} placeholder="Note for the admin (findings, questions, links)…" className={`${fieldClass} resize-none`} />
        </div>
      ) : (
        item.note && <p className="mt-3 text-xs text-slate-600">Your note: {item.note}</p>
      )}
    </article>
  )
}

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs font-medium text-slate-600">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap text-slate-800">{value}</dd>
    </div>
  )
}
