'use client'

import { useState, useTransition } from 'react'
import { addStoryToCollection, removeStoryFromCollection } from '@/actions/admin/collections'
import { fieldClass } from './fields'

export type MemberRow = { id: string; title: string; position: number; issue: number | null; live: boolean }
export type AvailableStory = { id: string; title: string }

export function CollectionStories({
  collectionId,
  kind,
  members,
  available,
}: {
  collectionId: string
  kind: string
  members: MemberRow[]
  available: AvailableStory[]
}) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [f, setF] = useState({ storyId: '', position: '', issue: '' })
  const magazine = kind === 'magazine'

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-ink">Stories in this {magazine ? 'magazine' : 'series'}</h2>
      <p className="mt-1 text-xs text-slate-600">
        {magazine
          ? 'Readers see articles grouped by issue, ordered by the "Order" number.'
          : 'Readers see numbered parts, ordered by the "Order" number (1 = first).'}{' '}
        Only published stories appear publicly. A story can be in one collection at a time.
      </p>

      <ul className="mt-4 flex flex-col gap-2">
        {members.length === 0 && <li className="text-sm text-slate-600">No stories yet.</li>}
        {members.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 p-3">
            <span className="min-w-0 flex-1 text-sm text-ink">
              {m.title}
              <span className="ml-2 text-xs text-slate-600">
                order {m.position}
                {magazine && m.issue ? ` · issue ${m.issue}` : ''}
                {!m.live ? ' · not published yet' : ''}
              </span>
            </span>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (!window.confirm(`Remove “${m.title}” from this ${magazine ? 'magazine' : 'series'}?`)) return
                setError(null)
                start(async () => {
                  const res = await removeStoryFromCollection(collectionId, m.id)
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

      <form
        className="mt-5 grid gap-3 sm:grid-cols-3"
        onSubmit={(e) => {
          e.preventDefault()
          setError(null)
          start(async () => {
            const res = await addStoryToCollection(collectionId, f)
            if (res?.error) setError(res.error)
            else setF({ storyId: '', position: '', issue: '' })
          })
        }}
      >
        <label className="block sm:col-span-3">
          <span className="mb-1 block text-xs font-medium text-ink">Add a story</span>
          <select required value={f.storyId} onChange={(e) => setF((s) => ({ ...s, storyId: e.target.value }))} className={fieldClass}>
            <option value="" disabled>Choose a story (not already in a collection)</option>
            {available.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink">Order</span>
          <input type="number" min="0" value={f.position} onChange={(e) => setF((s) => ({ ...s, position: e.target.value }))} placeholder="1" className={fieldClass} />
        </label>
        {magazine && (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink">Issue number</span>
            <input type="number" min="1" value={f.issue} onChange={(e) => setF((s) => ({ ...s, issue: e.target.value }))} placeholder="1" className={fieldClass} />
          </label>
        )}
        <div className="flex items-end">
          <button type="submit" disabled={pending || !f.storyId} className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-60">
            {pending ? 'Saving…' : 'Add'}
          </button>
        </div>
      </form>
      {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
    </section>
  )
}
