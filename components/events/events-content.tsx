'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EventCardData } from '@/lib/events'
import { registerForEvent, cancelRegistration } from '@/actions/events'

function DateBadge({ month, day }: { month: string; day: string }) {
  return (
    <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-ink text-white">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-brand">{month}</span>
      <span className="text-xl font-semibold leading-none">{day}</span>
    </div>
  )
}

function RegisterControl({ event, status, isLoggedIn }: { event: EventCardData; status?: string; isLoggedIn: boolean }) {
  const [current, setCurrent] = useState(status)
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)

  if (!isLoggedIn) {
    return (
      <Link href={`/auth/login?next=/events`} className="inline-flex shrink-0 items-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90">
        Log in to register
      </Link>
    )
  }

  const registered = current === 'registered' || current === 'waitlisted' || current === 'attended'
  return (
    <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
      {registered ? (
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand-muted">
            {current === 'waitlisted' ? 'On waitlist' : current === 'attended' ? 'Attended' : 'Registered'}
          </span>
          {current !== 'attended' && (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await cancelRegistration(event.id)
                  if (r?.error) setMsg(r.error)
                  else {
                    setCurrent(undefined)
                    setMsg(null)
                  }
                })
              }
              className="text-xs font-medium text-slate-600 underline disabled:opacity-60"
            >
              Cancel
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await registerForEvent(event.id)
              if (r?.error) setMsg(r.error)
              else {
                setCurrent(r?.success?.includes('waitlist') ? 'waitlisted' : 'registered')
                setMsg(null)
              }
            })
          }
          className="inline-flex items-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-60"
        >
          {pending ? 'Registering…' : event.full ? 'Join waitlist' : 'Register'}
        </button>
      )}
      {msg && <span role="alert" className="text-xs text-red-700">{msg}</span>}
    </div>
  )
}

export function EventsContent({
  upcoming,
  past,
  isLoggedIn,
  registrations,
}: {
  upcoming: EventCardData[]
  past: EventCardData[]
  isLoggedIn: boolean
  registrations: Record<string, string>
}) {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const list = tab === 'upcoming' ? upcoming : past

  return (
    <div>
      <div className="inline-flex rounded-lg bg-slate-200/70 p-1" role="group" aria-label="Show">
        {(['upcoming', 'past'] as const).map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={tab === t}
            onClick={() => setTab(t)}
            className={cn('rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors', tab === t ? 'bg-white text-ink shadow-sm' : 'text-slate-700 hover:text-ink')}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-4">
        {list.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
            {tab === 'upcoming' ? 'No upcoming events yet. Check back soon.' : 'No past events yet.'}
          </p>
        )}
        {list.map((e) => (
          <article key={e.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
            <DateBadge month={e.month} day={e.day} />
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-ink">{e.title}</h3>
              <p className="mt-1 inline-flex items-start gap-1.5 text-xs font-medium text-slate-600">
                <Clock className="mt-0.5 size-3.5 shrink-0" /> {e.meta}
              </p>
              {e.description && <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{e.description}</p>}
            </div>
            {tab === 'upcoming' && <RegisterControl event={e} status={registrations[e.id]} isLoggedIn={isLoggedIn} />}
          </article>
        ))}
      </div>
    </div>
  )
}
