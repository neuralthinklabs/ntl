'use client'

import { useState, useTransition } from 'react'
import { Check, Circle } from 'lucide-react'
import { setContactEnquiryHandled } from '@/actions/contact-admin'

export function AdminContactRow({
  id,
  name,
  email,
  message,
  submittedAt,
  handled,
}: {
  id: string
  name: string
  email: string
  message: string
  submittedAt: string
  handled: boolean
}) {
  const [isHandled, setIsHandled] = useState(handled)
  const [pending, startTransition] = useTransition()
  const [saveState, setSaveState] = useState<'idle' | 'error'>('idle')

  function toggle() {
    const next = !isHandled
    setIsHandled(next) // optimistic
    setSaveState('idle')
    startTransition(async () => {
      try {
        await setContactEnquiryHandled(id, next)
      } catch (err) {
        console.error('[admin] failed to update contact enquiry:', err)
        setIsHandled(!next) // revert on failure
        setSaveState('error')
      }
    })
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-ink">{name}</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            <a href={`mailto:${email}`} className="hover:text-brand">
              {email}
            </a>{' '}
            · {submittedAt}
          </p>
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-60 ${
            isHandled
              ? 'bg-brand/10 text-brand-muted'
              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          {isHandled ? <Check className="size-3.5" /> : <Circle className="size-3.5" />}
          {isHandled ? 'Handled' : 'Mark handled'}
        </button>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{message}</p>
      {saveState === 'error' && (
        <p className="mt-2 text-xs font-medium text-red-600">Couldn&apos;t save — try again</p>
      )}
    </div>
  )
}
