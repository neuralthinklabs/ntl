'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { searchPeople, type PersonHit } from '@/actions/admin/people'
import { fieldClass } from './fields'

type Result = { error?: string; success?: string } | null

const initials = (n: string) => n.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'N'

/**
 * Type a name, NTL ID or email -> pick a person from the list -> give a role -> Credit.
 * `excludeIds` hides people who are already credited.
 */
export function PeoplePicker({
  onAdd,
  excludeIds = [],
  pending,
}: {
  onAdd: (userId: string, role: string) => Promise<Result>
  excludeIds?: string[]
  pending?: boolean
}) {
  const listId = useId()
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<PersonHit[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [loading, setLoading] = useState(false)
  const [picked, setPicked] = useState<PersonHit | null>(null)
  const [role, setRole] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const seq = useRef(0)
  const boxRef = useRef<HTMLDivElement>(null)

  // Debounced search; stale responses are ignored.
  useEffect(() => {
    if (picked || query.trim().length < 2) {
      setHits([])
      setLoading(false)
      return
    }
    setLoading(true)
    const mine = ++seq.current
    const t = setTimeout(async () => {
      const res = await searchPeople(query)
      if (mine !== seq.current) return
      setHits(res.filter((h) => !excludeIds.includes(h.id)))
      setActive(0)
      setLoading(false)
    }, 250)
    return () => clearTimeout(t)
  }, [query, picked, excludeIds.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  function choose(p: PersonHit) {
    setPicked(p)
    setOpen(false)
    setQuery('')
    setError(null)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || hits.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % hits.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i - 1 + hits.length) % hits.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      choose(hits[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  async function submit() {
    if (!picked) return
    setSaving(true)
    setError(null)
    const res = await onAdd(picked.id, role)
    setSaving(false)
    if (res?.error) return setError(res.error)
    setPicked(null)
    setRole('')
  }

  return (
    <div ref={boxRef} className="mt-4">
      {!picked ? (
        <div className="relative">
          <label className="sr-only" htmlFor={`${listId}-q`}>Search people</label>
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
          <input
            id={`${listId}-q`}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Search by name, NTL ID or email to tag a person…"
            className={`${fieldClass} pl-9`}
          />
          {open && query.trim().length >= 2 && (
            <ul
              id={listId}
              role="listbox"
              className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
            >
              {loading && <li className="px-3 py-2 text-sm text-slate-600">Searching…</li>}
              {!loading && hits.length === 0 && <li className="px-3 py-2 text-sm text-slate-600">No one found.</li>}
              {hits.map((h, i) => (
                <li key={h.id} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(h)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${i === active ? 'bg-brand/10' : 'hover:bg-slate-50'}`}
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-foreground">
                      {initials(h.name)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink">{h.name}</span>
                      <span className="block truncate text-xs text-slate-600">
                        <span className="font-mono">{h.ntlId}</span> · {h.email}
                        {!h.showCredit && ' · public credit off'}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white py-1 pl-1 pr-2 text-sm text-ink">
            <span className="flex size-6 items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-brand-foreground">
              {initials(picked.name)}
            </span>
            {picked.name}
            <span className="font-mono text-xs text-slate-600">{picked.ntlId}</span>
            <button type="button" onClick={() => setPicked(null)} aria-label={`Remove ${picked.name}`} className="text-slate-500 hover:text-ink">
              <X className="size-4" />
            </button>
          </span>
          <label className="sr-only" htmlFor={`${listId}-role`}>Role on the project</label>
          <input
            id={`${listId}-role`}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submit()
              }
            }}
            maxLength={60}
            placeholder="Role, e.g. Researcher"
            className={`${fieldClass} min-w-[180px] flex-1`}
          />
          <button
            type="button"
            onClick={submit}
            disabled={saving || pending}
            className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Credit'}
          </button>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  )
}
