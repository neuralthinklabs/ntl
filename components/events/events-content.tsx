'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EventCardData } from '@/lib/events'

function DateBadge({ month, day }: { month: string; day: string }) {
  return (
    <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-ink text-white">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-brand">{month}</span>
      <span className="text-xl font-semibold leading-none">{day}</span>
    </div>
  )
}

// Registration and ticket choice happen on each event's own page, so the list
// only shows status and links there.
export function EventsContent({
  upcoming,
  past,
  registrations,
}: {
  upcoming: EventCardData[]
  past: EventCardData[]
  isLoggedIn?: boolean
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
        {list.map((e) => {
          const status = registrations[e.id]
          return (
            <article key={e.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
              <DateBadge month={e.month} day={e.day} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">{e.kindLabel}</p>
                <h3 className="mt-0.5 text-base font-semibold text-ink">
                  <Link href={`/events/${e.slug}`} className="hover:underline">{e.title}</Link>
                </h3>
                <p className="mt-1 inline-flex items-start gap-1.5 text-xs font-medium text-slate-600">
                  <Clock className="mt-0.5 size-3.5 shrink-0" /> {e.meta}
                </p>
                {e.description && <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-600">{e.description}</p>}
              </div>
              <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                {status && status !== 'cancelled' && (
                  <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand-muted">
                    {status === 'waitlisted' ? 'On waitlist' : status === 'attended' ? 'Attended' : 'Registered'}
                  </span>
                )}
                <Link href={`/events/${e.slug}`} className="inline-flex items-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90">
                  {tab === 'past' ? 'View' : status ? 'View ticket' : e.full ? 'Details · waitlist' : 'Details & register'}
                </Link>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
