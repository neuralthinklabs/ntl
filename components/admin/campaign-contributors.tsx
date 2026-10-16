'use client'

import { useState, useTransition } from 'react'
import { addContributor, removeContributor } from '@/actions/admin/contributors'
import { fieldClass } from './fields'

type Result = { error?: string; success?: string } | null

export function ContributorEditor({
  goalId,
  contributors,
}: {
  goalId: string
  contributors: { userId: string; name: string; ntlId: string; roleLabel: string; hidden: boolean }[]
}) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [ntlId, setNtlId] = useState('')
  const [label, setLabel] = useState('')

  const run = (fn: () => Promise<Result>, after?: () => void) => {
    setError(null)
    start(async () => {
      const res = await fn()
      if (res?.error) setError(res.error)
      else after?.()
    })
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-ink">People credited on this project</h2>
      <p className="mt-1 text-xs text-slate-600">Shown on the public Team tab by name and NTL ID. People who turned off public credit are listed here but not shown publicly.</p>
      <ul className="mt-4 flex flex-col gap-2">
        {contributors.length === 0 && <li className="text-sm text-slate-600">No one credited yet.</li>}
        {contributors.map((c) => (
          <li key={c.userId} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 p-3">
            <span className="min-w-0 flex-1 text-sm text-ink">
              {c.name} <span className="font-mono text-xs text-slate-600">{c.ntlId}</span>
              <span className="ml-2 text-xs text-slate-600">{c.roleLabel}</span>
              {c.hidden && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">hidden by user</span>}
            </span>
            <button
              type="button"
              disabled={pending}
              onClick={() => window.confirm(`Remove ${c.name}?`) && run(() => removeContributor(goalId, c.userId))}
              className="text-xs font-medium text-red-700 underline"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <form
        className="mt-4 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          run(() => addContributor(goalId, ntlId, label), () => {
            setNtlId('')
            setLabel('')
          })
        }}
      >
        <label className="sr-only" htmlFor="c-ntl">NTL ID</label>
        <input id="c-ntl" value={ntlId} onChange={(e) => setNtlId(e.target.value)} placeholder="NTL-XXXX-XXXX" className={`${fieldClass} w-44 font-mono`} />
        <label className="sr-only" htmlFor="c-role">Role on the project</label>
        <input id="c-role" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Role, e.g. Researcher" maxLength={60} className={`${fieldClass} min-w-[180px] flex-1`} />
        <button type="submit" disabled={pending} className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-60">
          Credit
        </button>
      </form>
      {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
    </section>
  )
}
