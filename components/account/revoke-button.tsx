'use client'

import { useState, useTransition } from 'react'
import { revokeAppAccess } from '@/actions/oauth'

export function RevokeButton({ clientId, appName }: { clientId: string; appName: string }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`Remove ${appName}'s access to your NTL account?`)) return
          setError(null)
          start(async () => {
            const res = await revokeAppAccess(clientId)
            if (res?.error) setError(res.error)
          })
        }}
        className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60"
      >
        {pending ? 'Removing…' : 'Remove access'}
      </button>
      {error && <span role="alert" className="text-xs text-red-700">{error}</span>}
    </span>
  )
}
