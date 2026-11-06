'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addMember, setMemberRole } from '@/actions/community-manage'
import { MEMBER_ROLES, ROLE_LABEL } from '@/lib/community/constants'
import { fieldClass } from '@/lib/ui'

export function RoleSelect({ communityId, userId, role }: { communityId: string; userId: string; role: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [value, setValue] = useState(role)
  const [error, setError] = useState<string | null>(null)
  return (
    <span className="inline-flex flex-col">
      <label className="sr-only" htmlFor={`role-${userId}`}>Role</label>
      <select
        id={`role-${userId}`}
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value
          const prev = value
          setValue(next)
          setError(null)
          start(async () => {
            const res = await setMemberRole(communityId, userId, next)
            if (res?.error) { setValue(prev); setError(res.error) } else router.refresh()
          })
        }}
        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs"
      >
        {MEMBER_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
      </select>
      {error && <span role="alert" className="text-xs text-red-700">{error}</span>}
    </span>
  )
}

export function AddMemberForm({ communityId, internal }: { communityId: string; internal: boolean }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [ntlId, setNtlId] = useState('')
  const [role, setRole] = useState('member')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  return (
    <form
      className="mt-4 flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        setMsg(null)
        start(async () => {
          const res = await addMember(communityId, ntlId, role)
          if (res?.error) setMsg({ ok: false, text: res.error })
          else { setMsg({ ok: true, text: res?.success ?? 'Added.' }); setNtlId(''); router.refresh() }
        })
      }}
    >
      <label className="block text-xs font-medium text-ink">{internal ? 'Invite by NTL ID' : 'Add by NTL ID'}
        <input value={ntlId} onChange={(e) => setNtlId(e.target.value.toUpperCase())} required placeholder="NTL-XXXX-XXXX" className={`${fieldClass} mt-1 w-48 font-mono`} />
      </label>
      <label className="block text-xs font-medium text-ink">Role
        <select value={role} onChange={(e) => setRole(e.target.value)} className={`${fieldClass} mt-1`}>
          {MEMBER_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
        </select>
      </label>
      <button type="submit" disabled={pending || !ntlId.trim()} className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-60">{pending ? 'Adding…' : 'Add'}</button>
      {msg && <span role={msg.ok ? 'status' : 'alert'} className={`text-xs ${msg.ok ? 'text-brand-muted' : 'text-red-700'}`}>{msg.text}</span>}
    </form>
  )
}
