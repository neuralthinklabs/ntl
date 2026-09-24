'use client'

import { useActionState, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { recordContribution } from '@/actions/goals'

const fieldClass =
  'w-full rounded-lg border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-brand focus:ring-2 focus:ring-brand/30'

export function ContributeForm({ goalId, goalSlug }: { goalId: string; goalSlug: string }) {
  const [state, formAction, pending] = useActionState(recordContribution, null)

  // Generated once per mount so a double-click or a retried request is
  // recognized server-side as the same contribution, not a new one
  // (P0 #5). A fresh id is picked up automatically after a successful
  // submit re-renders this component with a new key upstream, or on a
  // full page reload.
  const [clientRequestId] = useState(() => crypto.randomUUID())

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-start">
      <input type="hidden" name="goalId" value={goalId} />
      <input type="hidden" name="goalSlug" value={goalSlug} />
      <input type="hidden" name="clientRequestId" value={clientRequestId} />
      <input
        name="amount"
        type="number"
        min="1"
        step="1"
        required
        placeholder="Amount ($)"
        className={`${fieldClass} sm:w-40`}
      />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90 disabled:opacity-60"
      >
        {pending ? 'Processing…' : 'Support this goal'} <ArrowRight className="size-4" />
      </button>
      {state?.error && <p className="text-sm text-red-300 sm:basis-full">{state.error}</p>}
      {state?.success && <p className="text-sm text-brand sm:basis-full">{state.success}</p>}
    </form>
  )
}
