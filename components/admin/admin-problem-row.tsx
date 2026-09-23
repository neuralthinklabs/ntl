'use client'

import { useState, useTransition } from 'react'
import { StatusBadge } from '@/components/problems/status-badge'
import { updateProblemStatus } from '@/actions/problems'

const statuses = ['submitted', 'in_review', 'accepted', 'in_progress', 'resolved', 'declined'] as const

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
  const [pending, startTransition] = useTransition()

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
          onChange={(e) =>
            startTransition(() => updateProblemStatus(id, e.target.value as (typeof statuses)[number], notes))
          }
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
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => startTransition(() => updateProblemStatus(id, status as (typeof statuses)[number], notes))}
          placeholder="Note visible to the submitter…"
          className="min-w-[220px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink"
        />
      </div>
    </div>
  )
}
