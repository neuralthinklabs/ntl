'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { joinCommunity, leaveCommunity } from '@/actions/community'
import { btnPrimary, btnSecondary } from '@/lib/ui'

export function JoinButton({
  communityId,
  loggedIn,
  status,
  nextPath,
  compact = false,
}: {
  communityId: string
  loggedIn: boolean
  status: string | null
  nextPath: string
  compact?: boolean
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const size = compact ? '!h-9 !px-4' : ''

  if (!loggedIn) {
    return (
      <Link href={`/auth/login?next=${encodeURIComponent(nextPath)}`} className={`${btnPrimary} ${size}`}>
        Log in to join
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
    <div className="flex flex-col items-start gap-1.5">
      {status === 'active' ? (
        <button type="button" disabled={pending} onClick={() => window.confirm('Leave this group?') && run(() => leaveCommunity(communityId))} className={`${btnSecondary} ${size}`}>
          {pending ? 'Leaving…' : 'Joined · Leave'}
        </button>
      ) : status === 'pending' ? (
        <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800">Request pending</span>
      ) : status === 'banned' || status === 'suspended' ? (
        <span className="rounded-full bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700">{status === 'banned' ? 'Banned' : 'Suspended'}</span>
      ) : (
        <button type="button" disabled={pending} onClick={() => run(() => joinCommunity(communityId))} className={`${btnPrimary} ${size}`}>
          {pending ? 'Joining…' : 'Join'}
        </button>
      )}
      {msg && <p role={msg.ok ? 'status' : 'alert'} className={`text-xs ${msg.ok ? 'text-brand-muted' : 'text-red-700'}`}>{msg.text}</p>}
    </div>
  )
}
