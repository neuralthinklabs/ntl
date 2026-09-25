'use client'

import { useState, useTransition } from 'react'
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
}: {
  id: string
  title: string
  description: string
  status: string
  submitterEmail: string
  submittedAt: string
  adminNotes: string
}) {
  const [notes, setNotes] = useState(adminNotes)
  // P1 #12: track the last-saved value separately from the live input value
  // so we can tell "user blurred without changing anything" apart from
  // "user actually edited the note" — previously `onBlur` fired the update
  // unconditionally on every blur, including tab-through with no edits.
  const [savedNotes, setSavedNotes] = useState(adminNotes)
  const [pending, startTransition] = useTransition()
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle')

  function handleStatusChange(newStatus: Status) {
    startTransition(async () => {
      try {
        await updateProblemStatus(id, newStatus, notes)
        setSavedNotes(notes)
        setSaveState('saved')
      } catch (err) {
        console.error('[admin] status update failed:', err)
        setSaveState('error')
      }
    })
  }

  function saveNotesIfChanged() {
    if (notes === savedNotes) return // nothing to persist — skip the write
    startTransition(async () => {
      try {
        await updateProblemStatus(id, status as Status, notes)
        setSavedNotes(notes)
        setSaveState('saved')
      } catch (err) {
        console.error('[admin] note save failed:', err)
        setSaveState('error')
      }
    })
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {submitterEmail} · {submittedAt}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>
      <p className="mt-3 line-clamp-3 text-sm text-slate-600">{description}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select
          defaultValue={status}
          disabled={pending}
          onChange={(e) => handleStatusChange(e.target.value as Status)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
        <input
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value)
            setSaveState('idle')
          }}
          onBlur={saveNotesIfChanged}
          placeholder="Note visible to the submitter…"
          className="min-w-[220px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink"
        />
        {/* P1 #12: visible save feedback — previously the note save was
            silent, so an admin had no way to tell a save failed. */}
        {pending && <span className="text-xs text-slate-400">Saving…</span>}
        {!pending && saveState === 'saved' && (
          <span className="text-xs font-medium text-brand-muted">Saved</span>
        )}
        {!pending && saveState === 'error' && (
          <span className="text-xs font-medium text-red-600">
            Couldn&apos;t save — try again
          </span>
        )}
      </div>
    </div>
  )
}
