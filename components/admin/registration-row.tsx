'use client'

import { useState, useTransition } from 'react'
import { setRegistrationStatus } from '@/actions/admin/events'

const OPTIONS = ['registered', 'waitlisted', 'attended', 'cancelled'] as const

export function RegistrationRow({
  eventId,
  userId,
  name,
  email,
  status,
}: {
  eventId: string
  userId: string
  name: string
  email: string
  status: string
}) {
  const [value, setValue] = useState(status)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <tr className="border-t border-slate-200">
      <td className="py-2.5 pr-4 text-sm text-ink">{name}</td>
      <td className="py-2.5 pr-4 text-sm text-slate-600">{email}</td>
      <td className="py-2.5">
        <label className="sr-only" htmlFor={`reg-${userId}`}>Status for {name}</label>
        <select
          id={`reg-${userId}`}
          value={value}
          disabled={pending}
          onChange={(e) => {
            const next = e.target.value as (typeof OPTIONS)[number]
            const prev = value
            setValue(next)
            setError(null)
            start(async () => {
              const res = await setRegistrationStatus(eventId, userId, next)
              if (res?.error) {
                setValue(prev)
                setError(res.error)
              }
            })
          }}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm capitalize"
        >
          {OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        {error && <span role="alert" className="ml-2 text-xs text-red-700">{error}</span>}
      </td>
    </tr>
  )
}
