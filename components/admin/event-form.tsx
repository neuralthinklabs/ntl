'use client'

import { useActionState, useState } from 'react'
import { saveEvent } from '@/actions/admin/events'
import { EVENT_FORMATS, EVENT_KINDS, FORMAT_LABEL, KIND_LABEL, type EventFormat } from '@/lib/event-constants'
import { Field, FormMessage, SubmitButton, fieldClass } from './fields'

export type EventFormValues = {
  id?: string
  title: string
  slug: string
  kind: string
  description: string
  format: EventFormat
  location: string
  venueAddress: string
  venueMapUrl: string
  meetingUrl: string
  timezone: string
  startsAt: string
  endsAt: string
  registrationClosesAt: string
  capacity: string
  teamMin: string
  teamMax: string
  submissionDeadline: string
}

const ZONES = ['UTC', 'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Europe/London', 'Europe/Berlin', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Africa/Lagos', 'Australia/Sydney']

export function EventForm({ initial }: { initial?: EventFormValues }) {
  const [state, action] = useActionState(saveEvent, null)
  const [format, setFormat] = useState<EventFormat>(initial?.format ?? 'online')
  const [kind, setKind] = useState(initial?.kind ?? 'event')
  const v = initial
  const online = format !== 'in_person'
  const venue = format !== 'online'

  return (
    <form action={action} className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {v?.id && <input type="hidden" name="id" value={v.id} />}
      <Field label="Title">
        <input name="title" required defaultValue={v?.title} className={fieldClass} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Type" hint="Hackathons get teams and project submissions.">
          <select name="kind" value={kind} onChange={(e) => setKind(e.target.value)} className={fieldClass}>
            {EVENT_KINDS.map((k) => (
              <option key={k} value={k}>{KIND_LABEL[k]}</option>
            ))}
          </select>
        </Field>
        <Field label="Format">
          <select name="format" value={format} onChange={(e) => setFormat(e.target.value as EventFormat)} className={fieldClass}>
            {EVENT_FORMATS.map((f) => (
              <option key={f} value={f}>{FORMAT_LABEL[f]}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Description" hint="Plain text. Blank line = new paragraph. For hackathons add the rules, tracks and prizes here.">
        <textarea name="description" rows={6} defaultValue={v?.description} className={`${fieldClass} resize-none`} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Time zone" hint="The zone all times below are in.">
          <input name="timezone" list="zones" required defaultValue={v?.timezone ?? 'UTC'} className={fieldClass} />
          <datalist id="zones">
            {ZONES.map((z) => (
              <option key={z} value={z} />
            ))}
          </datalist>
        </Field>
        <Field label="Starts">
          <input name="startsAt" type="datetime-local" required defaultValue={v?.startsAt} className={fieldClass} />
        </Field>
        <Field label="Ends (optional)">
          <input name="endsAt" type="datetime-local" defaultValue={v?.endsAt} className={fieldClass} />
        </Field>
      </div>

      {online && (
        <Field label="Meeting link" hint="Zoom, Google Meet or Teams (https). Shown only to people with a confirmed ticket. You can add it later.">
          <input name="meetingUrl" type="url" defaultValue={v?.meetingUrl} className={fieldClass} placeholder="https://meet.google.com/… or https://zoom.us/j/…" />
        </Field>
      )}

      {venue && (
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Venue name">
            <input name="location" required defaultValue={v?.location} className={fieldClass} placeholder="e.g. Innovation Hub" />
          </Field>
          <Field label="Address (optional)">
            <input name="venueAddress" defaultValue={v?.venueAddress} className={fieldClass} placeholder="Street, city" />
          </Field>
          <Field label="Map link (optional)" hint="A Google Maps link (https).">
            <input name="venueMapUrl" type="url" defaultValue={v?.venueMapUrl} className={fieldClass} placeholder="https://maps.google.com/…" />
          </Field>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Registration closes (optional)" hint="Blank = open until the event starts.">
          <input name="registrationClosesAt" type="datetime-local" defaultValue={v?.registrationClosesAt} className={fieldClass} />
        </Field>
        <Field label="Total capacity (optional)" hint="People beyond this join a waitlist. Ticket quantities are set per ticket after saving.">
          <input name="capacity" type="number" min="1" defaultValue={v?.capacity} className={fieldClass} />
        </Field>
      </div>

      {kind === 'hackathon' && (
        <fieldset className="rounded-xl border border-brand/30 bg-brand-soft/40 p-4">
          <legend className="px-2 text-sm font-semibold text-ink">Hackathon settings</legend>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Min team size (optional)">
              <input name="teamMin" type="number" min="1" max="50" defaultValue={v?.teamMin} className={fieldClass} />
            </Field>
            <Field label="Max team size (optional)">
              <input name="teamMax" type="number" min="1" max="50" defaultValue={v?.teamMax} className={fieldClass} />
            </Field>
            <Field label="Submission deadline (optional)" hint="Teams and submissions lock after this.">
              <input name="submissionDeadline" type="datetime-local" defaultValue={v?.submissionDeadline} className={fieldClass} />
            </Field>
          </div>
        </fieldset>
      )}

      <Field label="Web address (optional)" hint="Leave blank to build it from the title.">
        <input name="slug" defaultValue={v?.slug} className={fieldClass} />
      </Field>
      <FormMessage state={state} />
      <div>
        <SubmitButton>{v?.id ? 'Save event' : 'Create event'}</SubmitButton>
      </div>
    </form>
  )
}
