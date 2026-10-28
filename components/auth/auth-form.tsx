'use client'

import { fieldClass } from '@/lib/ui'

import { useActionState } from 'react'
import Link from 'next/link'
import type { ActionState } from '@/actions/auth'
import { DotGrid } from '@/components/brand/graphics'
import { NtlAppIcon } from '@/components/brand/ntl-mark'


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
    <div className="relative overflow-hidden bg-canvas">
      <DotGrid className="absolute inset-0 text-ink/[0.06] [mask-image:radial-gradient(60%_60%_at_50%_40%,black,transparent)]" />
      <div className="relative mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-line bg-white p-6 shadow-lg shadow-ink/5 sm:p-8">
          <NtlAppIcon className="size-10" />
          <h1 className="mt-5 text-xl font-semibold tracking-tight text-ink">{title}</h1>
          <span aria-hidden className="mt-2 block h-0.5 w-8 bg-brand" />
          <p className="mt-3 text-sm text-slate-600">{description}</p>
          <div className="mt-6">{children}</div>
        </div>
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
