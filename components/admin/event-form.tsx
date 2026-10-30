'use client'

import { useActionState, useState } from 'react'
import { saveEvent } from '@/actions/admin/events'
import { Field, FormMessage, SubmitButton, fieldClass } from './fields'

export type EventFormValues = {
  id?: string
  title: string
  slug: string
  description: string
  location: string
  isOnline: boolean
  timezone: string
  startsAt: string
  endsAt: string
  capacity: string
  meetingUrl: string
}

const ZONES = ['UTC', 'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Europe/London', 'Europe/Berlin', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Africa/Lagos', 'Australia/Sydney']

export function EventForm({ initial }: { initial?: EventFormValues }) {
  const [state, action] = useActionState(saveEvent, null)
  const [online, setOnline] = useState(initial?.isOnline ?? false)
  const v = initial

  return (
    <form action={action} className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {v?.id && <input type="hidden" name="id" value={v.id} />}
      <Field label="Title">
        <input name="title" required defaultValue={v?.title} className={fieldClass} />
      </Field>
      <Field label="Description">
        <textarea name="description" rows={4} defaultValue={v?.description} className={`${fieldClass} resize-none`} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Time zone" hint="The zone the times below are in.">
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
      <div className="grid gap-5 sm:grid-cols-3">
        <label className="flex items-center gap-2 self-end pb-2.5 text-sm font-medium text-ink">
          <input
            type="checkbox"
            name="isOnline"
            checked={online}
            onChange={(e) => setOnline(e.target.checked)}
            className="size-4 accent-[#38b6ff]"
          />
          Online event
        </label>
        <Field label="Location" className="sm:col-span-1">
          <input name="location" disabled={online} defaultValue={v?.location} className={fieldClass} placeholder={online ? 'Online' : 'Venue, city'} />
        </Field>
        <Field label="Capacity (optional)" hint="People beyond this join a waitlist.">
          <input name="capacity" type="number" min="1" defaultValue={v?.capacity} className={fieldClass} />
        </Field>
      </div>
      <Field label="Meeting link (optional)" hint="https link to Zoom, Meet, etc. Shown only to registered people.">
        <input name="meetingUrl" type="url" defaultValue={v?.meetingUrl} className={fieldClass} placeholder="https://" />
      </Field>
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
