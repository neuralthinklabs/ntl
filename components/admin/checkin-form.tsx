'use client'

import { useRef, useState, useTransition } from 'react'
import { checkInByCode } from '@/actions/admin/events'
import { fieldClass } from './fields'

export function CheckInForm({ eventId }: { eventId: string }) {
  const [code, setCode] = useState('')
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const input = useRef<HTMLInputElement>(null)

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        setMsg(null)
        start(async () => {
          const res = await checkInByCode(eventId, code)
          if (res?.error) setMsg({ ok: false, text: res.error })
          else {
            setMsg({ ok: true, text: res?.success ?? 'Checked in.' })
            setCode('')
          }
          input.current?.focus()
        })
      }}
    >
      <label htmlFor="ticket-code" className="text-sm font-medium text-ink">Ticket code</label>
      <input
        ref={input}
        id="ticket-code"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        autoFocus
        autoComplete="off"
        autoCapitalize="characters"
        placeholder="T-ABC123"
        className={`${fieldClass} max-w-xs font-mono text-lg`}
      />
      <div>
        <button type="submit" disabled={pending || !code.trim()} className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-60">
          {pending ? 'Checking…' : 'Check in'}
        </button>
      </div>
      {msg && (
        <p role={msg.ok ? 'status' : 'alert'} className={`rounded-lg px-3.5 py-2.5 text-sm ${msg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
          {msg.text}
        </p>
      )}
    </form>
  )
}
