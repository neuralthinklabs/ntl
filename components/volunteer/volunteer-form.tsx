'use client'

import { useActionState, useState } from 'react'
import { fieldClass } from '@/lib/ui'
import { submitVolunteer } from '@/actions/volunteer'
import { goals } from '@/lib/ntldgs'

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-red-700"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-600">{hint}</span>}
    </label>
  )
}

export function VolunteerForm({ defaultName }: { defaultName: string }) {
  const [state, formAction, pending] = useActionState(submitVolunteer, null)
  // One id per form load: a double-click or retry is recognised as the same application.
  const [clientRequestId] = useState(() => crypto.randomUUID())

  if (state?.success) {
    return (
      <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h3 className="text-lg font-semibold text-ink">Application received</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{state.success}</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <input type="hidden" name="clientRequestId" value={clientRequestId} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" required>
          <input name="fullName" required minLength={2} maxLength={120} defaultValue={defaultName} className={fieldClass} />
        </Field>
        <Field label="Phone (optional)" hint="Only our team sees this.">
          <input name="phone" type="tel" maxLength={30} autoComplete="tel" className={fieldClass} />
        </Field>
      </div>

      <Field label="Where are you based?" required hint="City, state or country.">
        <input name="location" required minLength={2} maxLength={200} className={fieldClass} />
      </Field>

      <Field label="Your skills" required hint="e.g. research, design, writing, coding, community organising.">
        <textarea name="skills" required minLength={10} maxLength={2000} rows={3} className={`${fieldClass} resize-none`} />
      </Field>

      <fieldset>
        <legend className="mb-1.5 block text-sm font-medium text-ink">Goals you care about (optional)</legend>
        <div className="grid gap-1 sm:grid-cols-2">
          {goals.map((g) => (
            <label key={g.slug} className="flex cursor-pointer items-center gap-2.5 rounded-lg p-2 text-sm text-ink hover:bg-slate-50">
              <input type="checkbox" name="ntldg" value={g.slug} className="size-4 accent-[#38b6ff]" />
              {g.number}. {g.verb}: {g.title}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Hours per week (optional)">
          <input name="hoursPerWeek" type="number" min={1} max={80} step={1} className={fieldClass} />
        </Field>
        <Field label="When are you free? (optional)" hint="e.g. weekday evenings, weekends.">
          <input name="availability" maxLength={500} className={fieldClass} />
        </Field>
      </div>

      <Field label="Relevant experience (optional)">
        <textarea name="experience" maxLength={3000} rows={3} className={`${fieldClass} resize-none`} />
      </Field>

      <Field label="Why do you want to volunteer?" required>
        <textarea name="motivation" required minLength={20} maxLength={3000} rows={4} className={`${fieldClass} resize-none`} />
      </Field>

      <Field label="Links (optional)" hint="LinkedIn, portfolio, GitHub, anything that shows your work.">
        <input name="links" maxLength={1000} className={fieldClass} />
      </Field>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-fit items-center justify-center rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90 disabled:opacity-60"
      >
        {pending ? 'Sending…' : 'Submit application'}
      </button>
    </form>
  )
}
