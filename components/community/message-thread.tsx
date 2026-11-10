'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { deleteMessage, pollMessages, reportMessage, sendMessage, type ChatMessage } from '@/actions/messages'
import { REPORT_LABEL, REPORT_REASONS } from '@/lib/community/constants'
import { MESSAGE_MAX } from '@/lib/collab/constants'
import { fieldClass } from '@/lib/ui'
import { cn } from '@/lib/utils'

const POLL_MS = 8000

export function MessageThread({ ntlId, initial, canSend, blockedReason }: { ntlId: string; initial: ChatMessage[]; canSend: boolean; blockedReason: string | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>(initial)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const [reporting, setReporting] = useState<string | null>(null)
  const [reason, setReason] = useState<string>(REPORT_REASONS[0])
  const [details, setDetails] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const lastRef = useRef<string | undefined>(initial[initial.length - 1]?.createdAt)

  const merge = useCallback((incoming: ChatMessage[]) => {
    if (!incoming.length) return
    setMessages((cur) => {
      const ids = new Set(cur.map((m) => m.id))
      const fresh = incoming.filter((m) => !ids.has(m.id))
      return fresh.length ? [...cur, ...fresh] : cur
    })
    lastRef.current = incoming[incoming.length - 1].createdAt
  }, [])

  const poll = useCallback(async () => {
    const res = await pollMessages(ntlId, lastRef.current)
    if ('messages' in res) merge(res.messages)
  }, [ntlId, merge])

  useEffect(() => {
    const tick = () => { if (document.visibilityState === 'visible') void poll() }
    const t = setInterval(tick, POLL_MS)
    document.addEventListener('visibilitychange', tick)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', tick) }
  }, [poll])

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [messages.length])

  function send() {
    setError(null)
    setNote(null)
    const body = text
    start(async () => {
      const res = await sendMessage(ntlId, body)
      if (res?.error) setError(res.error)
      else { setText(''); await poll() }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex max-h-[60vh] min-h-[16rem] flex-col gap-2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4" aria-live="polite">
        {messages.length === 0 && <li className="text-sm text-slate-600">No messages yet. Say hello.</li>}
        {messages.map((m) => (
          <li key={m.id} className={cn('flex flex-col', m.mine ? 'items-end' : 'items-start')}>
            <div className={cn('max-w-[85%] rounded-2xl px-3.5 py-2 text-sm', m.mine ? 'bg-ink text-white' : 'bg-slate-100 text-slate-900', m.deleted && 'italic opacity-70')}>
              <p className="whitespace-pre-wrap break-words">{m.deleted ? 'Message deleted' : m.body}</p>
            </div>
            <div className="mt-0.5 flex items-center gap-3 text-[11px] text-slate-600">
              <time dateTime={m.createdAt} suppressHydrationWarning>{new Date(m.createdAt).toLocaleString()}</time>
              {m.mine && !m.deleted && (
                <button type="button" onClick={() => window.confirm('Delete this message for both of you?') && start(async () => { const r = await deleteMessage(m.id); if (r?.error) setError(r.error); else setMessages((cur) => cur.map((x) => (x.id === m.id ? { ...x, body: '', deleted: true } : x))) })} className="underline">Delete</button>
              )}
              {!m.mine && !m.deleted && <button type="button" onClick={() => setReporting(reporting === m.id ? null : m.id)} aria-expanded={reporting === m.id} className="underline">Report</button>}
            </div>
            {reporting === m.id && (
              <div className="mt-2 flex w-full max-w-sm flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="text-xs font-medium text-ink">Why are you reporting this?
                  <select value={reason} onChange={(e) => setReason(e.target.value)} className={`${fieldClass} mt-1`}>{REPORT_REASONS.map((r) => <option key={r} value={r}>{REPORT_LABEL[r]}</option>)}</select>
                </label>
                <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={2} maxLength={1000} placeholder="Anything administrators should know (optional)" className={`${fieldClass} resize-none`} />
                <p className="text-[11px] text-slate-600">Administrators will see this message and the few before it, nothing else from your inbox.</p>
                <div><button type="button" disabled={pending} onClick={() => start(async () => { const r = await reportMessage(m.id, reason, details); if (r?.error) setError(r.error); else { setNote(r?.success ?? 'Reported.'); setReporting(null); setDetails('') } })} className="rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">Send report</button></div>
              </div>
            )}
          </li>
        ))}
        <div ref={endRef} />
      </ul>

      {canSend ? (
        <form className="flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) send() }}>
          <label className="sr-only" htmlFor="dm-body">Message</label>
          <textarea id="dm-body" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && text.trim()) { e.preventDefault(); send() } }} rows={3} maxLength={MESSAGE_MAX} placeholder="Write a message… (Ctrl+Enter to send)" className={`${fieldClass} resize-y`} />
          <div><button type="submit" disabled={pending || !text.trim()} className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-60">{pending ? 'Sending…' : 'Send'}</button></div>
        </form>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-700">{blockedReason ?? 'You cannot send messages to this person.'}</p>
      )}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {note && <p role="status" className="text-sm text-brand-muted">{note}</p>}
    </div>
  )
}
