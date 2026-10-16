'use client'

import { useActionState, useEffect, useState } from 'react'
import { assignProblems } from '@/actions/admin/assignments'
import { Field, FormMessage, SubmitButton, fieldClass } from './fields'

type P = { id: string; title: string; category: string | null; date: string }
type Person = { id: string; label: string; role: string }

export function BulkAssignForm({ problems, people }: { problems: P[]; people: Person[] }) {
  const [state, action] = useActionState(assignProblems, null)
  const [selected, setSelected] = useState<string[]>([])
  const [mode, setMode] = useState<'one' | 'split'>('one')
  const [group, setGroup] = useState<string[]>([])

  useEffect(() => {
    if (state?.success) setSelected([])
  }, [state])

  const allOn = problems.length > 0 && selected.length === problems.length
  const each = group.length ? Math.ceil(selected.length / group.length) : 0

  if (people.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
        No volunteers or core-team members yet. Give someone that role in Admin &gt; Users first.
      </p>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-ink">1. Pick problems ({selected.length} selected)</h2>
          <button type="button" onClick={() => setSelected(allOn ? [] : problems.map((p) => p.id))} className="text-xs font-medium text-brand-muted underline">
            {allOn ? 'Clear' : 'Select all shown'}
          </button>
        </div>
        {problems.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">Every open problem already has a reviewer.</p>
        ) : (
          <ul className="mt-4 flex max-h-96 flex-col gap-1 overflow-y-auto">
            {problems.map((p) => (
              <li key={p.id}>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    name="problemId"
                    value={p.id}
                    checked={selected.includes(p.id)}
                    onChange={(e) => setSelected((s) => (e.target.checked ? [...s, p.id] : s.filter((x) => x !== p.id)))}
                    className="mt-1 size-4 accent-[#38b6ff]"
                  />
                  <span className="min-w-0 text-sm">
                    <span className="block font-medium text-ink">{p.title}</span>
                    <span className="block text-xs text-slate-600">{p.category ? `${p.category} · ` : ''}{p.date}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-ink">2. Give them to…</h2>
        <div className="mt-3 inline-flex rounded-lg bg-slate-200/70 p-1" role="group" aria-label="How to assign">
          {(['one', 'split'] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium ${mode === m ? 'bg-white text-ink shadow-sm' : 'text-slate-700'}`}
            >
              {m === 'one' ? 'One person' : 'Split evenly'}
            </button>
          ))}
        </div>
        <input type="hidden" name="mode" value={mode} />

        {mode === 'one' ? (
          <div className="mt-4">
            <Field label="Assign all selected to">
              <select name="assignee" required className={fieldClass} defaultValue="">
                <option value="" disabled>Choose a person</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>{p.label} ({p.role})</option>
                ))}
              </select>
            </Field>
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-sm text-slate-700">Tick the people to share the selected problems between.</p>
            <ul className="mt-2 grid gap-1 sm:grid-cols-2">
              {people.map((p) => (
                <li key={p.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      name="splitAmong"
                      value={p.id}
                      checked={group.includes(p.id)}
                      onChange={(e) => setGroup((g) => (e.target.checked ? [...g, p.id] : g.filter((x) => x !== p.id)))}
                      className="size-4 accent-[#38b6ff]"
                    />
                    <span className="text-sm text-ink">{p.label} <span className="text-xs text-slate-600">({p.role})</span></span>
                  </label>
                </li>
              ))}
            </ul>
            {group.length > 0 && selected.length > 0 && (
              <p className="mt-2 text-sm font-medium text-brand-muted">
                {selected.length} problems across {group.length} people ≈ {each} each
              </p>
            )}
          </div>
        )}

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Due date (optional)">
            <input name="dueDate" type="date" className={fieldClass} />
          </Field>
          <Field label="Instructions (optional)" hint="Sent with every problem, e.g. what to check.">
            <input name="brief" maxLength={2000} className={fieldClass} />
          </Field>
        </div>
      </section>

      <FormMessage state={state} />
      <div>
        <SubmitButton pendingLabel="Assigning…">Assign {selected.length || ''} problem{selected.length === 1 ? '' : 's'}</SubmitButton>
      </div>
    </form>
  )
}
