'use client'

import { useFormStatus } from 'react-dom'
import { cn } from '@/lib/utils'
import { fieldClass } from '@/lib/ui'
import type { ActionState } from '@/actions/auth'

// Re-exported so existing admin imports keep working; the style lives in lib/ui.ts.
export { fieldClass }

export function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string
  hint?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-600">{hint}</span>}
    </label>
  )
}

export function SubmitButton({
  children,
  pendingLabel = 'Saving…',
  name,
  value,
  variant = 'primary',
}: {
  children: React.ReactNode
  pendingLabel?: string
  name?: string
  value?: string
  variant?: 'primary' | 'outline'
}) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      className={cn(
        'inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60',
        variant === 'primary'
          ? 'bg-brand text-brand-foreground hover:bg-brand/90'
          : 'border border-slate-300 bg-white text-ink hover:bg-slate-50',
      )}
    >
      {pending ? pendingLabel : children}
    </button>
  )
}

export function FormMessage({ state }: { state: ActionState }) {
  if (!state) return null
  if (state.error)
    return (
      <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
        {state.error}
      </p>
    )
  if (state.success)
    return (
      <p role="status" className="rounded-lg bg-brand/10 px-3.5 py-2.5 text-sm text-brand-muted">
        {state.success}
      </p>
    )
  return null
}
