'use client'

import { useState, useTransition } from 'react'
import { addTicketType, deleteTicketType } from '@/actions/admin/tickets'
import { fieldClass } from './fields'

export type TicketRow = { id: string; name: string; description: string; quantity: number | null; sold: number; window: string }

export function TicketEditor({ eventId, timezone, tickets }: { eventId: string; timezone: string; tickets: TicketRow[] }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [f, setF] = useState({ name: '', description: '', quantity: '', salesStart: '', salesEnd: '' })
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }))

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-ink">Tickets</h2>
      <p className="mt-1 text-xs text-slate-600">
        No tickets = simple “Register” (everyone gets a ticket code anyway). Add ticket types (e.g. General, Student, Speaker) to let people choose one and to cap each type.
        All tickets are free for now. Times are in {timezone}.
      </p>
      <ul className="mt-4 flex flex-col gap-2">
        {tickets.length === 0 && <li className="text-sm text-slate-600">No ticket types yet.</li>}
        {tickets.map((t) => (
          <li key={t.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 p-3">
            <span className="min-w-0 flex-1 text-sm text-ink">
              <span className="font-medium">{t.name}</span>
              <span className="ml-2 text-xs text-slate-600">
                {t.sold}{t.quantity ? ` / ${t.quantity}` : ''} taken{t.window ? ` · ${t.window}` : ''}
              </span>
              {t.description && <span className="block text-xs text-slate-600">{t.description}</span>}
            </span>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                window.confirm(`Remove the “${t.name}” ticket?`) &&
                (setError(null),
                start(async () => {
                  const res = await deleteTicketType(t.id, eventId)
                  if (res?.error) setError(res.error)
                }))
              }
              className="text-xs font-medium text-red-700 underline"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <form
        className="mt-5 grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          setError(null)
          start(async () => {
            const res = await addTicketType(eventId, f)
            if (res?.error) setError(res.error)
            else setF({ name: '', description: '', quantity: '', salesStart: '', salesEnd: '' })
          })
        }}
      >
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink">Ticket name</span>
          <input value={f.name} onChange={set('name')} required placeholder="e.g. General" className={fieldClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink">Quantity (optional)</span>
          <input type="number" min="1" value={f.quantity} onChange={set('quantity')} className={fieldClass} />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-ink">Description (optional)</span>
          <input value={f.description} onChange={set('description')} maxLength={300} className={fieldClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink">Sales open (optional)</span>
          <input type="datetime-local" value={f.salesStart} onChange={set('salesStart')} className={fieldClass} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink">Sales close (optional)</span>
          <input type="datetime-local" value={f.salesEnd} onChange={set('salesEnd')} className={fieldClass} />
        </label>
        <div className="sm:col-span-2">
          <button type="submit" disabled={pending} className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-60">
            {pending ? 'Saving…' : 'Add ticket'}
          </button>
        </div>
      </form>
      {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
    </section>
  )
}
