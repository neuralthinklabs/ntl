'use client'

import { useState, useTransition } from 'react'
import { setUserRole } from '@/actions/admin/users'
import { ROLES, ROLE_LABELS, type Role } from '@/lib/roles'

export function UserRow({
  id,
  name,
  email,
  ntlId,
  role,
  points,
  joined,
  isSelf,
}: {
  id: string
  name: string
  email: string
  ntlId: string
  role: string
  points: number
  joined: string
  isSelf: boolean
}) {
  const [current, setCurrent] = useState(role)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <tr className="border-t border-slate-200">
      <td className="py-3 pr-4 text-sm font-medium text-ink">{name || '—'}</td>
      <td className="py-3 pr-4 text-sm text-slate-600">{email}</td>
      <td className="py-3 pr-4 font-mono text-xs text-slate-600">{ntlId}</td>
      <td className="py-3 pr-4 text-sm text-slate-600">{points}</td>
      <td className="py-3 pr-4 text-sm text-slate-600">{joined}</td>
      <td className="py-3">
        {isSelf ? (
          <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand-muted">{ROLE_LABELS[current] ?? current} (you)</span>
        ) : (
          <>
            <label className="sr-only" htmlFor={`role-${id}`}>Role for {email}</label>
            <select
              id={`role-${id}`}
              value={current}
              disabled={pending}
              onChange={(e) => {
                const next = e.target.value as Role
                if (!window.confirm(`Change ${email} to ${ROLE_LABELS[next]}?`)) return
                const prev = current
                setCurrent(next)
                setError(null)
                start(async () => {
                  const res = await setUserRole(id, next)
                  if (res?.error) {
                    setCurrent(prev)
                    setError(res.error)
                  }
                })
              }}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm disabled:opacity-60"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </>
        )}
        {error && <span role="alert" className="ml-2 text-xs text-red-700">{error}</span>}
      </td>
    </tr>
  )
}
