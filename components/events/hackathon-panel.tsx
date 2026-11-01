'use client'

import { useActionState, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createTeam, joinTeam, leaveTeam, saveSubmission } from '@/actions/hackathon'
import { fieldClass } from '@/lib/ui'
import type { MyTeam } from '@/lib/hackathon'

export function HackathonPanel({
  eventId,
  team,
  locked,
  teamMin,
  teamMax,
}: {
  eventId: string
  team: MyTeam | null
  locked: boolean
  teamMin: number | null
  teamMax: number | null
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [subState, subAction, subPending] = useActionState(saveSubmission, null)

  function run(fn: () => Promise<{ error?: string; success?: string } | null>, after?: () => void) {
    setMsg(null)
    start(async () => {
      const res = await fn()
      if (res?.error) setMsg({ ok: false, text: res.error })
      else {
        if (res?.success) setMsg({ ok: true, text: res.success })
        after?.()
        router.refresh()
      }
    })
  }

  const size = [teamMin ? `min ${teamMin}` : '', teamMax ? `max ${teamMax}` : ''].filter(Boolean).join(', ')

  return (
    <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-ink">Your team</h2>
      {size && <p className="mt-1 text-xs text-slate-600">Team size: {size}.</p>}
      {locked && <p className="mt-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">The deadline has passed. Teams and submissions are locked.</p>}

      {!team ? (
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-ink">Create a team</h3>
            <label className="sr-only" htmlFor="team-name">Team name</label>
            <input id="team-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Team name" disabled={locked} className={`${fieldClass} mt-2`} />
            <button type="button" disabled={pending || locked || name.trim().length < 2} onClick={() => run(() => createTeam(eventId, name), () => setName(''))} className="mt-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-60">
              Create team
            </button>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink">Join with an invite code</h3>
            <label className="sr-only" htmlFor="team-code">Invite code</label>
            <input id="team-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={6} placeholder="ABC123" disabled={locked} className={`${fieldClass} mt-2 font-mono`} />
            <button type="button" disabled={pending || locked || code.trim().length !== 6} onClick={() => run(() => joinTeam(eventId, code), () => setCode(''))} className="mt-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-slate-50 disabled:opacity-60">
              Join team
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-sm font-semibold text-ink">{team.name}</p>
          <p className="mt-1 text-sm text-slate-700">Members: {team.members.map((m) => m.name).join(', ')}</p>
          <p className="mt-2 text-sm text-slate-700">
            Invite code: <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-ink">{team.inviteCode}</span>
          </p>
          {!locked && (
            <button type="button" disabled={pending} onClick={() => window.confirm('Leave this team?') && run(() => leaveTeam(eventId))} className="mt-3 text-xs font-medium text-red-700 underline">
              Leave team
            </button>
          )}

          <h3 className="mt-6 text-sm font-semibold text-ink">Project submission</h3>
          <form action={subAction} className="mt-2 flex flex-col gap-3">
            <input type="hidden" name="eventId" value={eventId} />
            <fieldset disabled={locked} className="flex flex-col gap-3 disabled:opacity-70">
              <input name="title" required minLength={3} maxLength={120} defaultValue={team.submission?.title} placeholder="Project title" aria-label="Project title" className={fieldClass} />
              <textarea name="description" required minLength={20} maxLength={4000} rows={5} defaultValue={team.submission?.description} placeholder="What did you build and how does it work?" aria-label="Project description" className={`${fieldClass} resize-none`} />
              <input name="repoUrl" type="url" defaultValue={team.submission?.repoUrl} placeholder="Repository link (https://github.com/…)" aria-label="Repository link" className={fieldClass} />
              <input name="demoUrl" type="url" defaultValue={team.submission?.demoUrl} placeholder="Live demo link (optional)" aria-label="Demo link" className={fieldClass} />
              <input name="videoUrl" type="url" defaultValue={team.submission?.videoUrl} placeholder="Demo video link (optional)" aria-label="Video link" className={fieldClass} />
            </fieldset>
            {!locked && (
              <div>
                <button type="submit" disabled={subPending} className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-60">
                  {subPending ? 'Saving…' : team.submission ? 'Update submission' : 'Submit project'}
                </button>
              </div>
            )}
            {subState?.error && <p role="alert" className="text-sm text-red-700">{subState.error}</p>}
            {subState?.success && <p role="status" className="text-sm text-brand-muted">{subState.success}</p>}
          </form>
        </div>
      )}
      {msg && <p role={msg.ok ? 'status' : 'alert'} className={`mt-3 text-sm ${msg.ok ? 'text-brand-muted' : 'text-red-700'}`}>{msg.text}</p>}
    </section>
  )
}
