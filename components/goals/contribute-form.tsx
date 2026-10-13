'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { recordContribution } from '@/actions/goals'

const fieldClass =
  'w-full rounded-lg border border-white/25 bg-white/10 px-3.5 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/60 focus:border-brand focus:ring-2 focus:ring-brand/40'

export function ContributeForm({ goalId, isLoggedIn }: { goalId: string; isLoggedIn: boolean }) {
  const [state, formAction, pending] = useActionState(recordContribution, null)
  // One id per form load: a double-click or retry is recognised as the same pledge.
  const [clientRequestId] = useState(() => crypto.randomUUID())

  if (!isLoggedIn) {
    return (
      <p className="mt-6 text-sm text-white/80">
        <Link href={`/auth/login?next=${encodeURIComponent('/support')}`} className="font-semibold text-white underline">
          Log in
        </Link>{' '}
        or{' '}
        <Link href="/auth/signup" className="font-semibold text-white underline">
          create an account
        </Link>{' '}
        to pledge your support.
      </p>
    )
  }

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-start">
      <input type="hidden" name="goalId" value={goalId} />
      <input type="hidden" name="clientRequestId" value={clientRequestId} />
      <div className="sm:w-44">
        <label htmlFor="pledge-amount" className="sr-only">Pledge amount in US dollars</label>
        <input id="pledge-amount" name="amount" type="number" min="1" max="100000" step="1" required placeholder="Amount (USD)" className={fieldClass} />
      </div>
      <button type="submit" disabled={pending} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90 disabled:opacity-60">
        {pending ? 'Recording…' : 'Pledge support'} <ArrowRight className="size-4" />
      </button>
      {state?.error && <p role="alert" className="text-sm text-red-200 sm:basis-full">{state.error}</p>}
      {state?.success && <p role="status" className="text-sm text-emerald-200 sm:basis-full">{state.success}</p>}
    </form>
  )
}
