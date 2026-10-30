'use client'

import { useState, useTransition } from 'react'
import { reviewVolunteer } from '@/actions/admin/volunteers'

const STATUSES = ['new', 'reviewing', 'accepted', 'declined'] as const
type Status = (typeof STATUSES)[number]
const BADGE: Record<Status, string> = {
  new: 'bg-slate-100 text-slate-700',
  reviewing: 'bg-amber-100 text-amber-800',
  accepted: 'bg-emerald-100 text-emerald-800',
  declined: 'bg-red-100 text-red-700',
}

export type VolunteerRowProps = {
  id: string
  name: string
  email: string
  phone: string | null
  location: string
  skills: string
  goals: string[]
  hours: number | null
  availability: string | null
  experience: string | null
  motivation: string
  links: string | null
  status: string
  adminNotes: string
  date: string
}

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs font-medium text-slate-600">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap break-words text-slate-800">{value}</dd>
    </div>
  )
}

export function VolunteerRow(p: VolunteerRowProps) {
  const [status, setStatus] = useState<Status>(p.status as Status)
  const [saved, setSaved] = useState<Status>(p.status as Status)
  const [notes, setNotes] = useState(p.adminNotes)
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  function save() {
    setMsg(null)
    start(async () => {
      const res = await reviewVolunteer(p.id, status, notes)
      if (res?.error) setMsg({ ok: false, text: res.error })
      else {
        setSaved(status)
        setMsg({ ok: true, text: res?.success ?? 'Saved.' })
      }
    })
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-ink">{p.name}</h3>
          <p className="mt-0.5 text-xs text-slate-600">
            <a href={`mailto:${p.email}`} className="hover:text-brand">{p.email}</a> · {p.location} · {p.date}
            {p.hours ? ` · ${p.hours} h/week` : ''}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${BADGE[saved]}`}>{saved}</span>
      </div>

      <details className="mt-3 rounded-lg border border-slate-200 p-3">
        <summary className="cursor-pointer text-sm font-medium text-ink">Read the application</summary>
        <dl className="mt-3 flex flex-col gap-3 text-sm">
          <Row label="Skills" value={p.skills} />
          <Row label="Why they want to volunteer" value={p.motivation} />
          <Row label="Experience" value={p.experience} />
          <Row label="Availability" value={p.availability} />
          <Row label="Goals they care about" value={p.goals.length ? p.goals.join(', ') : null} />
          <Row label="Phone" value={p.phone} />
          <Row label="Links" value={p.links} />
        </dl>
      </details>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor={`vs-${p.id}`}>Status</label>
        <select id={`vs-${p.id}`} value={status} disabled={pending} onChange={(e) => setStatus(e.target.value as Status)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm capitalize text-ink">
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor={`vn-${p.id}`}>Note visible to the applicant</label>
        <input id={`vn-${p.id}`} value={notes} maxLength={2000} onChange={(e) => setNotes(e.target.value)} placeholder="Note emailed to the applicant…" className="min-w-[220px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink" />
        <button type="button" disabled={pending} onClick={save} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-slate-50 disabled:opacity-60">
          {pending ? 'Saving…' : 'Save'}
        </button>
        {msg && <span role={msg.ok ? 'status' : 'alert'} className={`text-xs font-medium ${msg.ok ? 'text-brand-muted' : 'text-red-700'}`}>{msg.text}</span>}
      </div>
      <p className="mt-2 text-xs text-slate-600">Changing the status emails the applicant. Accepting a plain member makes them a volunteer.</p>
    </div>
  )
}
