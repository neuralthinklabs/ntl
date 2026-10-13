'use client'

import { useState, useTransition } from 'react'
import { confirmContribution, refundContribution, rejectContribution } from '@/actions/admin/contributions'

const BADGE: Record<string, string> = {
  pledged: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-slate-200 text-slate-700',
  refunded: 'bg-red-100 text-red-700',
}

export function ContributionRow({
  id,
  who,
  campaign,
  amount,
  status,
  pledgeRef,
  paymentRef,
  note,
  date,
}: {
  id: string
  who: string
  campaign: string
  amount: string
  status: string
  pledgeRef: string
  paymentRef: string | null
  note: string | null
  date: string
}) {
  const [pending, start] = useTransition()
  const [payRef, setPayRef] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  function run(fn: () => Promise<{ error?: string; success?: string } | null>, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return
    setMsg(null)
    start(async () => {
      const res = await fn()
      if (res?.error) setMsg({ ok: false, text: res.error })
      else if (res?.success) setMsg({ ok: true, text: res.success })
    })
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">
            {amount} <span className="font-normal text-slate-600">to</span> {campaign}
          </p>
          <p className="mt-0.5 text-xs text-slate-600">
            {who} · {date} · ref <span className="font-mono">{pledgeRef}</span>
            {paymentRef ? ` · payment ref ${paymentRef}` : ''}
          </p>
          {note && <p className="mt-1 text-xs text-slate-600">“{note}”</p>}
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${BADGE[status] ?? ''}`}>{status}</span>
      </div>

      {status === 'pledged' && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor={`pay-${id}`}>Payment reference</label>
          <input
            id={`pay-${id}`}
            value={payRef}
            onChange={(e) => setPayRef(e.target.value)}
            placeholder="Bank/transaction reference (optional)"
            className="min-w-[220px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(
                () => confirmContribution(id, payRef),
                `Confirm that ${amount} has been received? This adds it to the public progress bar.`,
              )
            }
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-60"
          >
            Confirm payment received
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => rejectContribution(id), 'Reject this pledge?')}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
          >
            Reject
          </button>
        </div>
      )}

      {status === 'confirmed' && (
        <div className="mt-4">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(() => refundContribution(id), `Mark ${amount} as refunded? It will be removed from the progress bar.`)
            }
            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            Mark as refunded
          </button>
        </div>
      )}

      {msg && (
        <p role={msg.ok ? 'status' : 'alert'} className={`mt-3 text-xs font-medium ${msg.ok ? 'text-brand-muted' : 'text-red-700'}`}>
          {msg.text}
        </p>
      )}
    </div>
  )
}
