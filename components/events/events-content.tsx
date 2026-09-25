'use client'

import { useState } from 'react'
import { ArrowRight, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EventCardData } from '@/lib/events'

function DateBadge({ month, day }: { month: string; day: string }) {
  return (
    <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-ink text-white">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-brand">
        {month}
      </span>
      <span className="text-xl font-semibold leading-none">{day}</span>
    </div>
  )
}

// P2 #15: now driven by real `events` rows passed down from
// app/events/page.tsx instead of importing lib/data.ts directly.
export function EventsContent({
  upcoming,
  past,
}: {
  upcoming: EventCardData[]
  past: EventCardData[]
}) {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const list = tab === 'upcoming' ? upcoming : past

  return (
    <div>
      <div className="inline-flex rounded-lg bg-slate-100 p-1">
        {(['upcoming', 'past'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium capitalize transition-colors',
              tab === t
                ? 'bg-white text-ink shadow-sm'
                : 'text-slate-500 hover:text-ink',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-4">
        {list.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            {tab === 'upcoming' ? 'No upcoming events yet — check back soon.' : 'No past events yet.'}
          </p>
        )}
        {list.map((e) => (
          <article
            key={e.id}
            className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center"
          >
            <DateBadge month={e.month} day={e.day} />
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-ink">{e.title}</h3>
              <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Clock className="size-3.5" /> {e.meta}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                {e.description}
              </p>
            </div>
            <button
              type="button"
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                tab === 'upcoming'
                  ? 'bg-brand text-brand-foreground hover:bg-brand/90'
                  : 'border border-slate-200 text-ink hover:bg-slate-50',
              )}
            >
              {tab === 'upcoming' ? 'Register' : 'View recap'}
              <ArrowRight className="size-4" />
            </button>
          </article>
        ))}
      </div>
    </div>
  )
}
