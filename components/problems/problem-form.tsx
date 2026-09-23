'use client'

import { useActionState, useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { submitProblem } from '@/actions/problems'

const steps = ['Details', 'Context', 'Evidence', 'Review']

const fieldClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20'

export function ProblemForm({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [step, setStep] = useState(0)
  const [description, setDescription] = useState('')
  const [state, formAction, pending] = useActionState(submitProblem, null)

  return (
    <form action={formAction} className="grid gap-8 lg:grid-cols-[220px_1fr]">
      <nav aria-label="Progress" className="flex flex-col gap-1">
        {steps.map((label, i) => {
          const s = i < step ? 'done' : i === step ? 'current' : 'upcoming'
          return (
            <button
              key={label}
              type="button"
              onClick={() => i <= step && setStep(i)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors',
                s === 'current' ? 'bg-brand/10 text-ink' : 'text-slate-500 hover:bg-slate-50',
              )}
            >
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  s === 'done' && 'bg-brand text-brand-foreground',
                  s === 'current' && 'bg-ink text-white ring-2 ring-brand/30',
                  s === 'upcoming' && 'bg-slate-100 text-slate-400',
                )}
              >
                {s === 'done' ? <Check className="size-3.5" /> : i + 1}
              </span>
              {label}
            </button>
          )
        })}
      </nav>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {!isLoggedIn && (
          <div className="mb-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-700 ring-1 ring-inset ring-amber-200">
            You&apos;ll need to{' '}
            <a href="/auth/login?next=/problems" className="font-medium underline">
              log in
            </a>{' '}
            (or{' '}
            <a href="/auth/signup" className="font-medium underline">
              create an account
            </a>
            ) before submitting — your progress on this page is kept.
          </div>
        )}

        <div className={cn(step !== 0 && 'hidden')}>
          <div className="flex flex-col gap-5">
            <Field label="Title" required>
              <input name="title" type="text" required className={fieldClass} placeholder="e.g. Lack of clean water in rural communities" />
            </Field>
            <Field label="Description" required>
              <textarea
                name="description"
                rows={5}
                maxLength={2000}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={cn(fieldClass, 'resize-none')}
                placeholder="Describe the problem in detail…"
              />
              <span className="mt-1 block text-right text-xs text-slate-400">{description.length}/2000</span>
            </Field>
            <Field label="Category">
              <input name="category" type="text" className={fieldClass} placeholder="e.g. Health, Education, Environment" />
            </Field>
            <Field label="Location / context">
              <input name="location" type="text" className={fieldClass} placeholder="e.g. Village name, city, country" />
            </Field>
          </div>
        </div>

        <div className={cn(step !== 1 && 'hidden')}>
          <div className="flex flex-col gap-5">
            <Field label="Background & context">
              <textarea name="context" rows={5} className={cn(fieldClass, 'resize-none')} placeholder="What's the history? What's been tried before?" />
            </Field>
          </div>
        </div>

        <div className={cn(step !== 2 && 'hidden')}>
          <div className="flex flex-col gap-5">
            <Field label="Supporting evidence">
              <textarea name="evidenceNotes" rows={4} className={cn(fieldClass, 'resize-none')} placeholder="Links to research, data, articles or reports…" />
            </Field>
            <Field label="Attachments (up to 5 files, 10MB each)">
              <input
                name="files"
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-brand/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-muted"
              />
            </Field>
          </div>
        </div>

        <div className={cn(step !== 3 && 'hidden')}>
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-semibold text-ink">Review your submission</h3>
            <p className="text-sm leading-relaxed text-slate-500">
              Please review everything before submitting. Once submitted, our team will review your problem and follow up within 1–2 weeks.
            </p>
            <div className="rounded-lg bg-brand/5 p-4 text-sm text-brand-muted ring-1 ring-inset ring-brand/15">
              Your problem will be visible to the Neural Think Labs community once approved.
            </div>
            {state?.error && (
              <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{state.error}</p>
            )}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:text-ink disabled:opacity-0"
          >
            Back
          </button>
          {step === steps.length - 1 ? (
            <button
              type="submit"
              disabled={pending || !isLoggedIn}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90 disabled:opacity-60"
            >
              {pending ? 'Submitting…' : 'Submit problem'}
              <ArrowRight className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90"
            >
              Next step
              <ArrowRight className="size-4" />
            </button>
          )}
        </div>
      </div>
    </form>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-brand"> *</span>}
      </span>
      {children}
    </label>
  )
}
