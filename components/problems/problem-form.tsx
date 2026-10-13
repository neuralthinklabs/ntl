'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { submitProblem } from '@/actions/problems'
import { MAX_FILE_SIZE_BYTES, MAX_FILES, formatBytes, safeFileName } from '@/lib/upload-limits'
import { hasValidFileSignature } from '@/lib/file-signature'
import { createClient } from '@/lib/supabase/client'

const steps = ['Details', 'Context', 'Evidence', 'Review']
const DRAFT_KEY = 'ntl-problem-draft-v1'
const TEXT_FIELDS = ['title', 'description', 'category', 'location', 'context', 'evidenceNotes'] as const

const fieldClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-slate-500 focus:border-brand focus:ring-2 focus:ring-brand/30'

export function ProblemForm({
  isLoggedIn,
  ntldgSlug,
  ntldgLabel,
}: {
  isLoggedIn: boolean
  ntldgSlug: string
  ntldgLabel: string
}) {
  const [step, setStep] = useState(0)
  const [description, setDescription] = useState('')
  const [fileError, setFileError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [summary, setSummary] = useState<Record<string, string>>({})
  const [fileNames, setFileNames] = useState<string[]>([])
  const [state, formAction, pending] = useActionState(submitProblem, null)
  const formRef = useRef<HTMLFormElement>(null)
  const filesRef = useRef<HTMLInputElement>(null)
  // One id per form load: lets the server treat a retry/double-click as the same submission.
  const [clientRequestId] = useState(() => crypto.randomUUID())

  const read = (name: string) => (formRef.current?.elements.namedItem(name) as HTMLInputElement | null)?.value ?? ''

  // Restore a saved draft (so logging in mid-way does not lose the text).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null') as Record<string, string> | null
      if (!saved || !formRef.current) return
      for (const f of TEXT_FIELDS) {
        const el = formRef.current.elements.namedItem(f) as HTMLInputElement | null
        if (el && saved[f]) el.value = saved[f]
      }
      setDescription(saved.description ?? '')
    } catch {
      /* storage unavailable: no draft, that's fine */
    }
  }, [])

  function saveDraft() {
    try {
      const d: Record<string, string> = {}
      for (const f of TEXT_FIELDS) d[f] = read(f)
      localStorage.setItem(DRAFT_KEY, JSON.stringify(d))
    } catch {
      /* ignore */
    }
  }

  function stepIsValid(i: number) {
    const panel = formRef.current?.querySelector<HTMLElement>(`[data-step="${i}"]`)
    if (!panel) return true
    for (const el of Array.from(panel.querySelectorAll<HTMLInputElement>('input,textarea,select'))) {
      if (!el.checkValidity()) {
        el.reportValidity()
        return false
      }
    }
    return true
  }

  function go(next: number) {
    if (next > step && !stepIsValid(step)) return
    if (next === steps.length - 1) {
      const s: Record<string, string> = {}
      for (const f of TEXT_FIELDS) s[f] = read(f)
      setSummary(s)
      setFileNames(Array.from(filesRef.current?.files ?? []).map((f) => f.name))
    }
    setStep(next)
  }

  async function validateFiles(list: FileList | null) {
    if (!list || list.length === 0) return setFileError(null)
    if (list.length > MAX_FILES) return setFileError(`Please attach at most ${MAX_FILES} files (you selected ${list.length}).`)
    for (const f of Array.from(list)) {
      if (f.size > MAX_FILE_SIZE_BYTES) return setFileError(`"${f.name}" is ${formatBytes(f.size)}, over the ${formatBytes(MAX_FILE_SIZE_BYTES)} limit.`)
      if (!(await hasValidFileSignature(f))) return setFileError(`"${f.name}" is not a supported file. Use an image, PDF or Word document.`)
    }
    setFileError(null)
  }

  // Files go straight from the browser to Storage (a Server Action body is far
  // too small for 5x10MB). The server then re-verifies every uploaded file.
  async function onSubmit(fd: FormData) {
    setUploadError(null)
    const files = Array.from(filesRef.current?.files ?? [])
    const uploads: { path: string; name: string; type: string; size: number }[] = []

    if (files.length) {
      setUploading(true)
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error('not signed in')
        for (const f of files) {
          const path = `${user.id}/${clientRequestId}/${crypto.randomUUID()}-${safeFileName(f.name)}`
          const { error } = await supabase.storage.from('problem-attachments').upload(path, f, { contentType: f.type })
          if (error) throw error
          uploads.push({ path, name: f.name, type: f.type, size: f.size })
        }
      } catch (e) {
        console.error(e)
        setUploading(false)
        setUploadError('One of your files failed to upload. Check your connection and try again.')
        return
      }
      setUploading(false)
    }

    fd.delete('files')
    fd.set('uploads', JSON.stringify(uploads))
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch {
      /* ignore */
    }
    formAction(fd)
  }

  const busy = pending || uploading

  return (
    <form
      ref={formRef}
      action={onSubmit}
      onChange={saveDraft}
      // Enter in a single-line field must move forward, not submit a half-filled form.
      onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT' && (e.target as HTMLInputElement).type !== 'file') {
          e.preventDefault()
          if (step < steps.length - 1) go(step + 1)
        }
      }}
      className="grid gap-8 lg:grid-cols-[220px_1fr]"
    >
      <input type="hidden" name="clientRequestId" value={clientRequestId} />
      <input type="hidden" name="ntldgSlug" value={ntldgSlug} />

      <nav aria-label="Progress" className="flex flex-col gap-1">
        {steps.map((label, i) => {
          const s = i < step ? 'done' : i === step ? 'current' : 'upcoming'
          return (
            <button
              key={label}
              type="button"
              aria-current={s === 'current' ? 'step' : undefined}
              onClick={() => i <= step && go(i)}
              className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors', s === 'current' ? 'bg-brand/10 text-ink' : 'text-slate-600 hover:bg-slate-100')}
            >
              <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold', s === 'done' && 'bg-brand text-brand-foreground', s === 'current' && 'bg-ink text-white ring-2 ring-brand/30', s === 'upcoming' && 'bg-slate-200 text-slate-600')}>
                {s === 'done' ? <Check className="size-3.5" /> : i + 1}
              </span>
              {label}
            </button>
          )
        })}
      </nav>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {!isLoggedIn && (
          <div className="mb-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-inset ring-amber-200">
            You&apos;ll need to{' '}
            <Link href="/auth/login?next=/problems" className="font-medium underline">log in</Link> (or{' '}
            <Link href="/auth/signup" className="font-medium underline">create an account</Link>) before submitting. What you&apos;ve typed is saved on this device, so it will be here when you return.
          </div>
        )}
        {ntldgLabel && (
          <p className="mb-6 rounded-lg bg-brand/10 px-4 py-2.5 text-sm text-brand-muted">
            This problem will be linked to the goal <strong>{ntldgLabel}</strong>.
          </p>
        )}

        <div data-step="0" hidden={step !== 0}>
          <div className="flex flex-col gap-5">
            <Field label="Title" required>
              <input name="title" type="text" required minLength={3} maxLength={200} className={fieldClass} placeholder="e.g. Lack of clean water in rural communities" />
            </Field>
            <Field label="Description" required>
              <textarea name="description" rows={5} minLength={20} maxLength={2000} required value={description} onChange={(e) => setDescription(e.target.value)} className={cn(fieldClass, 'resize-none')} placeholder="Describe the problem in detail (at least 20 characters)…" />
              <span className="mt-1 block text-right text-xs text-slate-600">{description.length}/2000</span>
            </Field>
            <Field label="Category">
              <input name="category" type="text" maxLength={80} className={fieldClass} placeholder="e.g. Health, Education, Environment" />
            </Field>
            <Field label="Location / context">
              <input name="location" type="text" maxLength={200} className={fieldClass} placeholder="e.g. Village name, city, country" />
            </Field>
          </div>
        </div>

        <div data-step="1" hidden={step !== 1}>
          <Field label="Background & context">
            <textarea name="context" rows={6} maxLength={5000} className={cn(fieldClass, 'resize-none')} placeholder="What's the history? What's been tried before?" />
          </Field>
        </div>

        <div data-step="2" hidden={step !== 2}>
          <div className="flex flex-col gap-5">
            <Field label="Supporting evidence">
              <textarea name="evidenceNotes" rows={4} maxLength={5000} className={cn(fieldClass, 'resize-none')} placeholder="Links to research, data, articles or reports…" />
            </Field>
            <Field label={`Attachments (up to ${MAX_FILES} files, ${formatBytes(MAX_FILE_SIZE_BYTES)} each: images, PDF, Word)`}>
              <input
                ref={filesRef}
                name="files"
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => validateFiles(e.target.files)}
                className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-brand/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-muted"
              />
              {fileError && <p role="alert" className="mt-1.5 text-xs text-red-700">{fileError}</p>}
            </Field>
          </div>
        </div>

        <div data-step="3" hidden={step !== 3}>
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-semibold text-ink">Review your submission</h3>
            <dl className="divide-y divide-slate-200 rounded-lg border border-slate-200 text-sm">
              {[
                ['Title', summary.title],
                ['Description', summary.description],
                ['Category', summary.category],
                ['Location', summary.location],
                ['Background', summary.context],
                ['Evidence notes', summary.evidenceNotes],
                ['Attachments', fileNames.join(', ')],
              ].map(([k, v]) => (
                <div key={k} className="grid gap-1 p-3 sm:grid-cols-[140px_1fr]">
                  <dt className="font-medium text-slate-600">{k}</dt>
                  <dd className="whitespace-pre-wrap break-words text-ink">{v || <span className="text-slate-500">Not provided</span>}</dd>
                </div>
              ))}
            </dl>
            <p className="text-sm leading-relaxed text-slate-600">Our team reviews new problems within 1–2 weeks and emails you whenever the status changes. You can track it under “My problems”.</p>
            {fileError && <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">Fix the attachment issue before submitting: {fileError}</p>}
            {uploadError && <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{uploadError}</p>}
            {state?.error && <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{state.error}</p>}
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <button type="button" onClick={() => go(Math.max(0, step - 1))} disabled={step === 0} className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:text-ink disabled:invisible">
            Back
          </button>
          {step === steps.length - 1 ? (
            <button type="submit" disabled={busy || !isLoggedIn || !!fileError} className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90 disabled:opacity-60">
              {uploading ? 'Uploading files…' : pending ? 'Submitting…' : 'Submit problem'}
              <ArrowRight className="size-4" />
            </button>
          ) : (
            <button type="button" onClick={() => go(step + 1)} className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90">
              Next step <ArrowRight className="size-4" />
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
        {required && <span className="text-red-700"> *</span>}
      </span>
      {children}
    </label>
  )
}
