'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { Countdown } from './countdown'
import type { AnnouncementData } from '@/lib/site-controls'
import { cn } from '@/lib/utils'

const TONE: Record<AnnouncementData['tone'], string> = {
  info: 'bg-ink-2 text-white',
  success: 'bg-emerald-700 text-white',
  warning: 'bg-amber-300 text-ink',
  urgent: 'bg-red-700 text-white',
}

const key = (a: AnnouncementData) => `ntl-announcement-${a.id}-${a.version}`

export function AnnouncementBar({ items }: { items: AnnouncementData[] }) {
  const [hidden, setHidden] = useState<string[]>([])
  const sig = items.map((i) => `${i.id}:${i.version}`).join(',')

  useEffect(() => {
    try {
      setHidden(items.filter((i) => i.dismissible && localStorage.getItem(key(i)) === '1').map((i) => i.id))
    } catch {
      /* storage unavailable: nothing is hidden */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig])

  const shown = items.filter((i) => !hidden.includes(i.id))
  if (!shown.length) return null

  return (
    <div role="region" aria-label="Announcements">
      {shown.map((a) => (
        <div key={a.id} className={cn('relative px-10 py-2.5 text-center text-sm', TONE[a.tone])}>
          <span className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span className="font-medium">{a.message}</span>
            {a.countdownTo && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-black/20 px-2 py-0.5 text-xs font-semibold">
                {a.countdownLabel && <span className="font-medium opacity-90">{a.countdownLabel}</span>}
                <Countdown to={a.countdownTo} endText={a.countdownEndText ?? ''} />
              </span>
            )}
            {a.linkUrl &&
              (a.linkUrl.startsWith('/') ? (
                <Link href={a.linkUrl} className="font-semibold underline underline-offset-2">{a.linkLabel || 'Learn more'}</Link>
              ) : (
                <a href={a.linkUrl} target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2">{a.linkLabel || 'Learn more'}</a>
              ))}
          </span>
          {a.dismissible && (
            <button
              type="button"
              aria-label="Dismiss announcement"
              onClick={() => {
                setHidden((h) => [...h, a.id])
                try {
                  localStorage.setItem(key(a), '1')
                } catch {
                  /* ignore */
                }
              }}
              className="absolute right-3 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md hover:bg-black/15"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
