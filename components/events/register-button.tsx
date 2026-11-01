'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { registerForEvent, cancelRegistration } from '@/actions/events'
import { btnPrimary, btnSecondary } from '@/lib/ui'
import { cn } from '@/lib/utils'
import type { TicketOption } from '@/lib/event-page'

const NOTE: Record<TicketOption['state'], string> = { open: '', soon: 'Not on sale yet', closed: 'Sales ended', soldout: 'Sold out' }

export function RegisterButton({
  eventId,
  status,
  isLoggedIn,
  full,
  closed,
  nextPath,
  tickets,
}: {
  eventId: string
  status?: string
  isLoggedIn: boolean
  full: boolean
  closed: boolean
  nextPath: string
  tickets: TicketOption[]
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [picked, setPicked] = useState<string>(tickets.find((t) => t.state === 'open')?.id ?? '')

  const registered = status === 'registered' || status === 'waitlisted' || status === 'attended'
  if (closed && !registered) return null
  if (!isLoggedIn) {
    return (
      <Link href={`/auth/login?next=${encodeURIComponent(nextPath)}`} className={btnPrimary}>
        Log in to get a ticket
      </Link>
    )
  }

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
    <div className="flex flex-col items-start gap-3">
      {registered ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-brand/10 px-3 py-1.5 text-sm font-medium text-brand-muted">
            {status === 'waitlisted' ? 'You are on the waitlist' : status === 'attended' ? 'You attended' : 'You are registered'}
          </span>
          {status !== 'attended' && !closed && (
            <button type="button" disabled={pending} onClick={() => window.confirm('Cancel your registration?') && run(() => cancelRegistration(eventId))} className={btnSecondary}>
              {pending ? 'Cancelling…' : 'Cancel registration'}
            </button>
          )}
        </div>
      ) : (
        <>
          {tickets.length > 0 && (
            <fieldset className="flex w-full max-w-md flex-col gap-2">
              <legend className="mb-1 text-sm font-semibold text-ink">Choose a ticket</legend>
              {tickets.map((t) => {
                const disabled = t.state !== 'open'
                return (
                  <label key={t.id} className={cn('flex cursor-pointer items-start gap-3 rounded-xl border p-3', picked === t.id ? 'border-ink bg-white shadow-sm' : 'border-slate-200 bg-white', disabled && 'cursor-not-allowed opacity-60')}>
                    <input type="radio" name="ticket" value={t.id} disabled={disabled} checked={picked === t.id} onChange={() => setPicked(t.id)} className="mt-1 size-4 accent-[#38b6ff]" />
                    <span className="min-w-0 text-sm">
                      <span className="block font-medium text-ink">
                        {t.name} <span className="ml-1 text-xs font-normal text-slate-600">Free</span>
                      </span>
                      {t.description && <span className="block text-xs text-slate-600">{t.description}</span>}
                      <span className="block text-xs text-slate-600">
                        {NOTE[t.state] || (t.left !== null ? `${t.left} left` : '')}
                      </span>
                    </span>
                  </label>
                )
              })}
            </fieldset>
          )}
          <button
            type="button"
            disabled={pending || (tickets.length > 0 && !picked)}
            onClick={() => run(() => registerForEvent(eventId, picked || null))}
            className={btnPrimary}
          >
            {pending ? 'Registering…' : full ? 'Join the waitlist' : tickets.length ? 'Get ticket' : 'Register'}
          </button>
        </>
      )}
      {msg && (
        <p role={msg.ok ? 'status' : 'alert'} className={`text-sm ${msg.ok ? 'text-brand-muted' : 'text-red-700'}`}>
          {msg.text}
        </p>
      )}
    </div>
  )
}
