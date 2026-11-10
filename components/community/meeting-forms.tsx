'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveMinutes, scheduleMeeting, setRsvp } from '@/actions/meetings'
import { RSVP_LABEL, RSVP_RESPONSES } from '@/lib/collab/constants'
import { Field, FormMessage, SubmitButton, fieldClass } from '@/components/admin/fields'
import { cn } from '@/lib/utils'

const ZONES = ['UTC', 'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Europe/London', 'Europe/Berlin', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Africa/Lagos', 'Australia/Sydney']

export function ScheduleMeetingForm({ communityId }: { communityId: string }) {
  const [state, action] = useActionState(scheduleMeeting, null)
  const [zone, setZone] = useState('UTC')
  useEffect(() => {
    try { setZone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC') } catch { /* keep UTC */ }
  }, [])
  return (
    <form action={action} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <input type="hidden" name="communityId" value={communityId} />
      <h3 className="text-base font-semibold text-ink">Schedule a meeting</h3>
      <Field label="Title"><input name="title" required minLength={3} maxLength={200} className={fieldClass} /></Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Time zone" hint="All times below are in this zone.">
          <input name="timezone" list="meeting-zones" required value={zone} onChange={(e) => setZone(e.target.value)} className={fieldClass} />
          <datalist id="meeting-zones">{ZONES.map((z) => <option key={z} value={z} />)}</datalist>
        </Field>
        <Field label="Starts"><input name="startsAt" type="datetime-local" required className={fieldClass} /></Field>
        <Field label="Ends (optional)"><input name="endsAt" type="datetime-local" className={fieldClass} /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Meeting link (optional)" hint="Zoom, Meet or Teams (https). Only members see it."><input name="meetingUrl" type="url" placeholder="https://…" className={fieldClass} /></Field>
        <Field label="Place (optional)" hint="Add a link, a place, or both."><input name="location" maxLength={200} className={fieldClass} /></Field>
      </div>
      <Field label="Agenda (optional)"><textarea name="agenda" rows={3} maxLength={3000} className={`${fieldClass} resize-none`} /></Field>
      <Field label="Description (optional)"><textarea name="description" rows={2} maxLength={3000} className={`${fieldClass} resize-none`} /></Field>
      <FormMessage state={state} />
      <div><SubmitButton pendingLabel="Scheduling…">Schedule and notify members</SubmitButton></div>
    </form>
  )
}

export function RsvpButtons({ meetingId, mine }: { meetingId: string; mine: string | null }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Your response">
      {RSVP_RESPONSES.map((r) => (
        <button
          key={r}
          type="button"
          disabled={pending}
          aria-pressed={mine === r}
          onClick={() => { setError(null); start(async () => { const res = await setRsvp(meetingId, r); if (res?.error) setError(res.error); else router.refresh() }) }}
          className={cn('rounded-full border px-3 py-1 text-xs font-medium disabled:opacity-60', mine === r ? 'border-ink bg-ink text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50')}
        >
          {RSVP_LABEL[r]}
        </button>
      ))}
      {error && <span role="alert" className="text-xs text-red-700">{error}</span>}
    </div>
  )
}

export function MinutesForm({ meetingId, initial }: { meetingId: string; initial: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [text, setText] = useState(initial)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  return (
    <form
      className="mt-3 flex flex-col gap-2"
      onSubmit={(e) => { e.preventDefault(); setMsg(null); start(async () => { const res = await saveMinutes(meetingId, text); if (res?.error) setMsg({ ok: false, text: res.error }); else { setMsg({ ok: true, text: 'Saved.' }); router.refresh() } }) }}
    >
      <label className="text-xs font-medium text-ink" htmlFor={`min-${meetingId}`}>Minutes and decisions</label>
      <textarea id={`min-${meetingId}`} value={text} onChange={(e) => setText(e.target.value)} rows={5} maxLength={20000} className={`${fieldClass} resize-y`} />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-slate-50 disabled:opacity-60">{pending ? 'Saving…' : 'Save minutes'}</button>
        {msg && <span role={msg.ok ? 'status' : 'alert'} className={cn('text-xs', msg.ok ? 'text-brand-muted' : 'text-red-700')}>{msg.text}</span>}
      </div>
    </form>
  )
}
