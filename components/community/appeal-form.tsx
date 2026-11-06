'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { submitAppeal } from '@/actions/community'
import { fieldClass } from '@/lib/ui'

export function AppealForm({ actionId }: { actionId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="text-xs font-medium text-brand-muted underline">Appeal this decision</button>
  return (
    <form
      className="mt-2 flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        setError(null)
        start(async () => {
          const res = await submitAppeal(actionId, message)
          if (res?.error) setError(res.error)
          else router.refresh()
        })
      }}
    >
      <label className="sr-only" htmlFor={`appeal-${actionId}`}>Why are you appealing?</label>
      <textarea id={`appeal-${actionId}`} value={message} onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={2000} required placeholder="Explain why this decision should be reconsidered." className={`${fieldClass} resize-none`} />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-60">{pending ? 'Sending…' : 'Send appeal'}</button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-slate-600 underline">Cancel</button>
        {error && <span role="alert" className="text-xs text-red-700">{error}</span>}
      </div>
    </form>
  )
}
