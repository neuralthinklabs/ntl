'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import type { ActionState } from '@/actions/auth'

const fieldClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20'

type Field = {
  name: string
  label: string
  type: string
  placeholder?: string
  autoComplete?: string
}

export function AuthForm({
  action,
  fields,
  submitLabel,
  hiddenFields,
  footer,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
  fields: Field[]
  submitLabel: string
  hiddenFields?: Record<string, string>
  footer?: React.ReactNode
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    null,
  )

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {hiddenFields &&
        Object.entries(hiddenFields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}

      {fields.map((f) => (
        <label key={f.name} className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">
            {f.label}
          </span>
          <input
            name={f.name}
            type={f.type}
            required
            autoComplete={f.autoComplete}
            placeholder={f.placeholder}
            className={fieldClass}
          />
        </label>
      ))}

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-lg bg-brand/10 px-3.5 py-2.5 text-sm text-brand-muted">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90 disabled:opacity-60"
      >
        {pending ? 'Please wait…' : submitLabel}
      </button>

      {footer}
    </form>
  )
}

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          {title}
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">{description}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}

export function AuthLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link href={href} className="text-brand-muted hover:underline">
      {children}
    </Link>
  )
}
