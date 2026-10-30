'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { registerForEvent, cancelRegistration } from '@/actions/events'
import { btnPrimary, btnSecondary } from '@/lib/ui'

export function RegisterButton({
  eventId,
  status,
  isLoggedIn,
  full,
  past,
  nextPath,
}: {
  eventId: string
  status?: string
  isLoggedIn: boolean
  full: boolean
  past: boolean
  nextPath: string
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  if (past) return null
  if (!isLoggedIn) {
    return (
      <Link href={`/auth/login?next=${encodeURIComponent(nextPath)}`} className={btnPrimary}>
        Log in to register
      </Link>
    )
  }

  const registered = status === 'registered' || status === 'waitlisted' || status === 'attended'

  function run(fn: () => Promise<{ error?: string; success?: string } | null>) {
    setMsg(null)
    start(async () => {
      const res = await fn()
      if (res?.error) setMsg({ ok: false, text: res.error })
      else {
        if (res?.success) setMsg({ ok: true, text: res.success })
        router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-col items-start gap-2">
      {registered ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-brand/10 px-3 py-1.5 text-sm font-medium text-brand-muted">
            {status === 'waitlisted' ? 'You are on the waitlist' : status === 'attended' ? 'You attended' : 'You are registered'}
          </span>
          {status !== 'attended' && (
            <button
              type="button"
              disabled={pending}
              onClick={() => window.confirm('Cancel your registration?') && run(() => cancelRegistration(eventId))}
              className={btnSecondary}
            >
              {pending ? 'Cancelling…' : 'Cancel registration'}
            </button>
          )}
        </div>
      ) : (
        <button type="button" disabled={pending} onClick={() => run(() => registerForEvent(eventId))} className={btnPrimary}>
          {pending ? 'Registering…' : full ? 'Join the waitlist' : 'Register'}
        </button>
      )}
      {msg && (
        <p role={msg.ok ? 'status' : 'alert'} className={`text-sm ${msg.ok ? 'text-brand-muted' : 'text-red-700'}`}>
          {msg.text}
        </p>
      )}
    </div>
  )
}
