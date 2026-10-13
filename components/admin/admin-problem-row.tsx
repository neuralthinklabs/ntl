'use client'

import { useState, useTransition } from 'react'
import { Paperclip } from 'lucide-react'
import { StatusBadge } from '@/components/problems/status-badge'
import { updateProblemStatus } from '@/actions/problems'

const statuses = ['submitted', 'in_review', 'accepted', 'in_progress', 'resolved', 'declined'] as const
type Status = (typeof statuses)[number]

export function AdminProblemRow({
  id,
  title,
  description,
  status,
  submitterEmail,
  submittedAt,
  adminNotes,
  goalLabel,
  category,
  location,
  attachments,
}: {
  id: string
  title: string
  description: string
  status: string
  submitterEmail: string
  submittedAt: string
  adminNotes: string
  goalLabel?: string
  category?: string | null
  location?: string | null
  attachments: { name: string; url: string | null }[]
}) {
  const [currentStatus, setCurrentStatus] = useState<Status>(status as Status)
  const [notes, setNotes] = useState(adminNotes)
  const [savedNotes, setSavedNotes] = useState(adminNotes)
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle')

  function save(nextStatus: Status) {
    startTransition(async () => {
      try {
        await updateProblemStatus(id, nextStatus, notes)
        setCurrentStatus(nextStatus)
        setSavedNotes(notes)
        setSaveState('saved')
      } catch (err) {
        console.error('[admin] problem update failed:', err)
        setSaveState('error')
      }
    })
  }

  const notesChanged = notes !== savedNotes

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          <p className="mt-0.5 text-xs text-slate-600">
            {submitterEmail} · {submittedAt}
            {category ? ` · ${category}` : ''}
            {location ? ` · ${location}` : ''}
          </p>
          {goalLabel && <p className="mt-1 text-xs font-medium text-brand-muted">Goal: {goalLabel}</p>}
        </div>
        <StatusBadge status={currentStatus} />
      </div>

      <p className={`mt-3 whitespace-pre-wrap text-sm text-slate-700 ${open ? '' : 'line-clamp-3'}`}>{description}</p>
      {description.length > 220 && (
        <button type="button" onClick={() => setOpen((o) => !o)} className="mt-1 text-xs font-medium text-brand-muted underline">
          {open ? 'Show less' : 'Read more'}
        </button>
      )}

      {attachments.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {attachments.map((a) => (
            <li key={a.name}>
              {a.url ? (
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-ink hover:bg-slate-200"
                >
                  <Paperclip className="size-3.5" /> {a.name}
                </a>
              ) : (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{a.name} (unavailable)</span>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor={`status-${id}`}>Status</label>
        <select
          id={`status-${id}`}
          value={currentStatus}
          disabled={pending}
          onChange={(e) => save(e.target.value as Status)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor={`note-${id}`}>Note visible to the submitter</label>
        <input
          id={`note-${id}`}
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value)
            setSaveState('idle')
          }}
          placeholder="Note visible to the submitter…"
          className="min-w-[220px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink"
        />
        <button
          type="button"
          disabled={pending || !notesChanged}
          onClick={() => save(currentStatus)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-ink hover:bg-slate-50 disabled:opacity-50"
        >
          Save note
        </button>
        {pending && <span className="text-xs text-slate-500">Saving…</span>}
        {!pending && saveState === 'saved' && <span className="text-xs font-medium text-brand-muted">Saved. The submitter was emailed if the status changed.</span>}
        {!pending && saveState === 'error' && <span className="text-xs font-medium text-red-700">Couldn&apos;t save. Try again.</span>}
      </div>
    </div>
  )
}
