'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MessageSquare, ThumbsUp, Flag } from 'lucide-react'
import { blockUser, reportContent, toggleReaction, votePoll } from '@/actions/community'
import { REACTION_KINDS, REACTION_LABEL, REPORT_LABEL, REPORT_REASONS } from '@/lib/community/constants'
import type { PollView } from '@/lib/community/queries'
import { cn } from '@/lib/utils'
import { fieldClass } from '@/lib/ui'

export function ReactionBar({
  postId,
  reactions,
  comments,
  mine,
  canInteract,
  loggedIn,
  detailHref,
  authorId,
  viewerId,
}: {
  postId: string
  reactions: number
  comments: number
  mine: string | null
  canInteract: boolean
  loggedIn: boolean
  detailHref?: string
  authorId: string | null
  viewerId: string | null
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const [reporting, setReporting] = useState(false)
  const [reason, setReason] = useState<string>(REPORT_REASONS[0])
  const [details, setDetails] = useState('')

  function run(fn: () => Promise<{ error?: string; success?: string } | null>, then?: () => void) {
    setMsg(null)
    start(async () => {
      const res = await fn()
      if (res?.error) setMsg(res.error)
      else {
        if (res?.success && res.success !== 'ok') setMsg(res.success)
        then?.()
        router.refresh()
      }
    })
  }

  const chip = 'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-60'
  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2">
        {REACTION_KINDS.map((k) => (
          <button
            key={k}
            type="button"
            disabled={pending || !canInteract}
            title={canInteract ? undefined : loggedIn ? 'Join this group to react' : 'Log in to react'}
            aria-pressed={mine === k}
            onClick={() => run(() => toggleReaction(postId, k))}
            className={cn(chip, mine === k ? 'border-ink bg-ink text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50')}
          >
            {k === 'like' && <ThumbsUp className="size-3.5" />}
            {REACTION_LABEL[k]}
          </button>
        ))}
        <span className="text-xs text-slate-600">{reactions} reaction{reactions === 1 ? '' : 's'}</span>
        {detailHref && (
          <Link href={detailHref} className={cn(chip, 'ml-auto border-slate-300 bg-white text-slate-700 hover:bg-slate-50')}>
            <MessageSquare className="size-3.5" /> {comments} comment{comments === 1 ? '' : 's'}
          </Link>
        )}
        {loggedIn && (
          <button type="button" onClick={() => setReporting((r) => !r)} className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 underline" aria-expanded={reporting}>
            <Flag className="size-3.5" /> Report
          </button>
        )}
        {loggedIn && authorId && authorId !== viewerId && (
          <button type="button" disabled={pending} onClick={() => window.confirm('Block this person? You will stop seeing their posts and comments, and they cannot comment on yours.') && run(() => blockUser(authorId))} className="text-xs font-medium text-slate-600 underline">
            Block
          </button>
        )}
      </div>
      {reporting && (
        <div className="mt-3 flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <label className="text-xs font-medium text-ink">Why are you reporting this?
            <select value={reason} onChange={(e) => setReason(e.target.value)} className={`${fieldClass} mt-1`}>
              {REPORT_REASONS.map((r) => <option key={r} value={r}>{REPORT_LABEL[r]}</option>)}
            </select>
          </label>
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={2} maxLength={1000} placeholder="Anything moderators should know (optional)" className={`${fieldClass} resize-none`} />
          <div>
            <button type="button" disabled={pending} onClick={() => run(() => reportContent({ postId, reason, details }), () => { setReporting(false); setDetails('') })} className="rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
              Send report
            </button>
          </div>
        </div>
      )}
      {msg && <p role="status" className="mt-2 text-xs text-slate-700">{msg}</p>}
    </div>
  )
}

export function Poll({ postId, poll, closed, canInteract }: { postId: string; poll: PollView; closed: boolean; canInteract: boolean }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const showResults = closed || poll.myOptionId !== null || !canInteract

  return (
    <div className="mt-4 flex flex-col gap-2" role="group" aria-label="Poll">
      {poll.options.map((o) => {
        const pct = poll.total ? Math.round((o.votes / poll.total) * 100) : 0
        return showResults ? (
          <div key={o.id} className="relative overflow-hidden rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            <span aria-hidden className="absolute inset-y-0 left-0 bg-brand/15" style={{ width: `${pct}%` }} />
            <span className="relative flex justify-between gap-3">
              <span className={poll.myOptionId === o.id ? 'font-semibold text-ink' : 'text-slate-800'}>{o.label}{poll.myOptionId === o.id && ' ✓'}</span>
              <span className="text-slate-600">{pct}% ({o.votes})</span>
            </span>
          </div>
        ) : (
          <button
            key={o.id}
            type="button"
            disabled={pending}
            onClick={() => { setMsg(null); start(async () => { const r = await votePoll(postId, o.id); if (r?.error) setMsg(r.error); else router.refresh() }) }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm text-ink hover:bg-slate-50 disabled:opacity-60"
          >
            {o.label}
          </button>
        )
      })}
      <p className="text-xs text-slate-600">{poll.total} vote{poll.total === 1 ? '' : 's'}{closed ? ' · closed' : ''}{!canInteract && !closed ? ' · join the group to vote' : ''}</p>
      {msg && <p role="alert" className="text-xs text-red-700">{msg}</p>}
    </div>
  )
}
