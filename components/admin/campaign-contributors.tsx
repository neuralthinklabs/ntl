'use client'

import { useState, useTransition } from 'react'
import { PeoplePicker } from './people-picker'

type Result = { error?: string; success?: string } | null
export type ContributorRow = { userId: string; name: string; ntlId: string; roleLabel: string; hidden: boolean }

export function ContributorEditor({
  contributors,
  add,
  remove,
  where = 'this project',
}: {
  contributors: ContributorRow[]
  add: (userId: string, role: string) => Promise<Result>
  remove: (userId: string) => Promise<Result>
  where?: string
}) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-ink">People credited on {where}</h2>
      <p className="mt-1 text-xs text-slate-600">
        Shown publicly by name and NTL ID. People who turned off public credit are listed here but not shown publicly.
      </p>
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
              onClick={() => {
                if (!window.confirm(`Remove ${c.name}?`)) return
                setError(null)
                start(async () => {
                  const res = await remove(c.userId)
                  if (res?.error) setError(res.error)
                })
              }}
              className="text-xs font-medium text-red-700 underline"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <PeoplePicker onAdd={add} excludeIds={contributors.map((c) => c.userId)} pending={pending} />
      {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
    </section>
  )
}
