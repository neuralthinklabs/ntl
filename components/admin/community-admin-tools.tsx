'use client'

import { useActionState, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { decideAppeal, personAction } from '@/actions/admin/community'
import { Field, FormMessage, SubmitButton, fieldClass } from './fields'

export function PersonActionForm() {
  const [state, action] = useActionState(personAction, null)
  return (
    <form action={action} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2">
      <Field label="NTL ID"><input name="ntlId" required placeholder="NTL-XXXX-XXXX" className={`${fieldClass} font-mono uppercase`} /></Field>
      <Field label="Action">
        <select name="action" defaultValue="verify" className={fieldClass}>
          <option value="verify">Make verified contributor</option>
          <option value="unverify">Remove verified contributor</option>
          <option value="suspend">Suspend from all community features</option>
          <option value="ban">Ban from all community features</option>
          <option value="lift">Lift suspension or ban</option>
        </select>
      </Field>
      <Field label="Days (for suspensions)"><input name="days" type="number" min="1" max="365" className={fieldClass} /></Field>
      <Field label="Reason (shown to the person for suspensions and bans)"><input name="reason" maxLength={500} className={fieldClass} /></Field>
      <div className="sm:col-span-2 flex flex-col gap-3"><FormMessage state={state} /><div><SubmitButton pendingLabel="Applying…">Apply</SubmitButton></div></div>
    </form>
  )
}

export function AppealDecision({ appealId }: { appealId: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const decide = (overturn: boolean) => {
    setError(null)
    start(async () => {
      const res = await decideAppeal(appealId, overturn, note)
      if (res?.error) setError(res.error)
      else router.refresh()
    })
  }
  return (
    <div className="mt-3 flex flex-col gap-2">
      <label className="sr-only" htmlFor={`note-${appealId}`}>Note the person will see</label>
      <input id={`note-${appealId}`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder="Note the person will see" className={fieldClass} />
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={pending} onClick={() => decide(true)} className="rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-60">Accept appeal (reverse decision)</button>
        <button type="button" disabled={pending} onClick={() => decide(false)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-ink hover:bg-slate-50 disabled:opacity-60">Reject appeal</button>
        {error && <span role="alert" className="text-xs text-red-700">{error}</span>}
      </div>
    </div>
  )
}
