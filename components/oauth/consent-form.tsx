'use client'

import { useState, useTransition } from 'react'
import { decideAuthorization } from '@/actions/oauth'

export function ConsentForm({ authorizationId, appName }: { authorizationId: string; appName: string }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function decide(approve: boolean) {
    setError(null)
    start(async () => {
      // On success the server action redirects back to the app.
      const res = await decideAuthorization(authorizationId, approve)
      if (res?.error) setError(res.error)
    })
  }

  return (
    <div className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={pending}
          onClick={() => decide(true)}
          className="inline-flex flex-1 items-center justify-center rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90 disabled:opacity-60"
        >
          {pending ? 'Please wait…' : `Continue to ${appName}`}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => decide(false)}
          className="inline-flex flex-1 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-ink transition-colors hover:bg-slate-50 disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}
