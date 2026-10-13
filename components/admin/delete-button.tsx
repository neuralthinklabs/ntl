'use client'

import { useState, useTransition } from 'react'
import type { ActionState } from '@/actions/auth'

/** Confirm-then-run button for destructive admin actions (pass a bound server action). */
export function DeleteButton({
  action,
  what,
  label = 'Delete',
}: {
  action: () => Promise<ActionState>
  what: string
  label?: string
}) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`Delete ${what}? This cannot be undone.`)) return
          setError(null)
          start(async () => {
            const res = await action()
            if (res?.error) setError(res.error)
          })
        }}
        className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60"
      >
        {pending ? 'Deleting…' : label}
      </button>
      {error && <span role="alert" className="text-xs text-red-700">{error}</span>}
    </span>
  )
}
