'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { saveAnnouncement, savePageControl } from '@/actions/admin/site'
import { COMMON_PATHS } from '@/lib/site-constants'
import { Field, FormMessage, SubmitButton, fieldClass } from './fields'

const ZONES = ['UTC', 'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Europe/London', 'Europe/Berlin', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Africa/Lagos', 'Australia/Sydney']

function useZone(fixed?: string) {
  const [zone, setZone] = useState(fixed ?? 'UTC')
  useEffect(() => {
    if (fixed) return
    try {
      setZone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC')
    } catch {
      /* keep UTC */
    }
  }, [fixed])
  return [zone, setZone] as const
}

function ZoneField({ id, zone, setZone }: { id: string; zone: string; setZone: (z: string) => void }) {
  return (
    <Field label="Time zone" hint="All dates below are in this zone.">
      <input name="timezone" list={id} required value={zone} onChange={(e) => setZone(e.target.value)} className={fieldClass} />
      <datalist id={id}>{ZONES.map((z) => <option key={z} value={z} />)}</datalist>
    </Field>
  )
}

export type AnnouncementValues = {
  id?: string
  message: string
  linkUrl: string
  linkLabel: string
  tone: string
  startsAt: string
  endsAt: string
  countdownTo: string
  countdownLabel: string
  countdownEndText: string
  dismissible: boolean
  active: boolean
}

export function AnnouncementForm({ initial }: { initial?: AnnouncementValues }) {
  const [state, action] = useActionState(saveAnnouncement, null)
  const [zone, setZone] = useZone(initial ? 'UTC' : undefined)
  const formRef = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (state?.success && !initial?.id) formRef.current?.reset()
  }, [state, initial?.id])
  const v = initial
  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {v?.id && <input type="hidden" name="id" value={v.id} />}
      <h3 className="text-base font-semibold text-ink">{v?.id ? 'Edit announcement' : 'New announcement'}</h3>
      <Field label="Message" hint="Shown in a bar at the top of every page. Up to 300 characters.">
        <input name="message" required maxLength={300} defaultValue={v?.message} className={fieldClass} placeholder="e.g. Global Innovation Summit registrations are open" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Look">
          <select name="tone" defaultValue={v?.tone ?? 'info'} className={fieldClass}>
            <option value="info">Info (dark)</option>
            <option value="success">Good news (green)</option>
            <option value="warning">Notice (yellow)</option>
            <option value="urgent">Urgent (red)</option>
          </select>
        </Field>
        <Field label="Link (optional)" hint="https://… or a page like /events">
          <input name="linkUrl" defaultValue={v?.linkUrl} className={fieldClass} />
        </Field>
        <Field label="Link text (optional)">
          <input name="linkLabel" maxLength={40} defaultValue={v?.linkLabel} className={fieldClass} placeholder="Learn more" />
        </Field>
      </div>
      <ZoneField id="ann-zones" zone={zone} setZone={setZone} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Show from (optional)" hint="Blank = now."><input name="startsAt" type="datetime-local" defaultValue={v?.startsAt} className={fieldClass} /></Field>
        <Field label="Hide at (optional)" hint="Blank = until you hide it."><input name="endsAt" type="datetime-local" defaultValue={v?.endsAt} className={fieldClass} /></Field>
      </div>
      <fieldset className="rounded-xl border border-slate-200 p-4">
        <legend className="px-2 text-sm font-semibold text-ink">Countdown (optional)</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Counts down to"><input name="countdownTo" type="datetime-local" defaultValue={v?.countdownTo} className={fieldClass} /></Field>
          <Field label="Label" hint="e.g. Starts in"><input name="countdownLabel" maxLength={60} defaultValue={v?.countdownLabel} className={fieldClass} /></Field>
          <Field label="Text at zero" hint="e.g. We are live!"><input name="countdownEndText" maxLength={120} defaultValue={v?.countdownEndText} className={fieldClass} /></Field>
        </div>
      </fieldset>
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm font-medium text-ink"><input type="checkbox" name="dismissible" defaultChecked={v?.dismissible ?? true} className="size-4 accent-[#38b6ff]" /> Visitors can dismiss it</label>
        <label className="flex items-center gap-2 text-sm font-medium text-ink"><input type="checkbox" name="active" defaultChecked={v?.active ?? true} className="size-4 accent-[#38b6ff]" /> Showing</label>
      </div>
      <FormMessage state={state} />
      <div><SubmitButton>{v?.id ? 'Save announcement' : 'Add announcement'}</SubmitButton></div>
    </form>
  )
}

export type PageControlValues = {
  id?: string
  pathPrefix: string
  title: string
  message: string
  blocksAt: string
  opensAt: string
  showCountdown: boolean
}

export function PageControlForm({ initial }: { initial?: PageControlValues }) {
  const [state, action] = useActionState(savePageControl, null)
  const [zone, setZone] = useZone(initial ? 'UTC' : undefined)
  const formRef = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (state?.success && !initial?.id) formRef.current?.reset()
  }, [state, initial?.id])
  const v = initial
  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {v?.id && <input type="hidden" name="id" value={v.id} />}
      <h3 className="text-base font-semibold text-ink">{v?.id ? 'Edit page rule' : 'Block a page'}</h3>
      <Field label="Page" hint="A path such as /events blocks that page and everything under it. “/” is the home page only. “*” is the whole site (maintenance mode). Admin, sign-in, API and legal pages can never be blocked.">
        <input name="pathPrefix" list="page-paths" required defaultValue={v?.pathPrefix} className={`${fieldClass} font-mono`} placeholder="/events" />
        <datalist id="page-paths">{COMMON_PATHS.map((p) => <option key={p} value={p} />)}</datalist>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Headline (optional)"><input name="title" maxLength={120} defaultValue={v?.title} className={fieldClass} placeholder="Registrations open soon" /></Field>
        <Field label="Message (optional)"><textarea name="message" rows={2} maxLength={1000} defaultValue={v?.message} className={`${fieldClass} resize-none`} placeholder="Shown to visitors instead of the page." /></Field>
      </div>
      <ZoneField id="pc-zones" zone={zone} setZone={setZone} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Block from (optional)" hint="Blank = block right now."><input name="blocksAt" type="datetime-local" defaultValue={v?.blocksAt} className={fieldClass} /></Field>
        <Field label="Opens at (optional)" hint="Blank = stays blocked until you open it. The page opens by itself at this time."><input name="opensAt" type="datetime-local" defaultValue={v?.opensAt} className={fieldClass} /></Field>
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-ink"><input type="checkbox" name="showCountdown" defaultChecked={v?.showCountdown} className="size-4 accent-[#38b6ff]" /> Show a countdown to the opening time</label>
      <FormMessage state={state} />
      <div><SubmitButton>{v?.id ? 'Save rule' : 'Block page'}</SubmitButton></div>
    </form>
  )
}
