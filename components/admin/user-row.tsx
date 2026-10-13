'use client'

import { useState, useTransition } from 'react'
import { setUserRole } from '@/actions/admin/users'

export function UserRow({
  id,
  name,
  email,
  role,
  points,
  joined,
  isSelf,
}: {
  id: string
  name: string
  email: string
  role: string
  points: number
  joined: string
  isSelf: boolean
}) {
  const [current, setCurrent] = useState(role)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const next = current === 'admin' ? 'member' : 'admin'

  return (
    <tr className="border-t border-slate-200">
      <td className="py-3 pr-4 text-sm font-medium text-ink">{name || '—'}</td>
      <td className="py-3 pr-4 text-sm text-slate-600">{email}</td>
      <td className="py-3 pr-4 text-sm text-slate-600">{points}</td>
      <td className="py-3 pr-4 text-sm text-slate-600">{joined}</td>
      <td className="py-3">
        <span className={`mr-3 rounded-full px-2.5 py-1 text-xs font-medium ${current === 'admin' ? 'bg-brand/10 text-brand-muted' : 'bg-slate-100 text-slate-700'}`}>
          {current}
        </span>
        {!isSelf && (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (!window.confirm(`Make ${email} ${next === 'admin' ? 'an admin' : 'a regular member'}?`)) return
              setError(null)
              start(async () => {
                const res = await setUserRole(id, next)
                if (res?.error) setError(res.error)
                else setCurrent(next)
              })
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-slate-50 disabled:opacity-60"
          >
            {next === 'admin' ? 'Make admin' : 'Remove admin'}
          </button>
        )}
        {error && <span role="alert" className="ml-2 text-xs text-red-700">{error}</span>}
      </td>
    </tr>
  )
}
