import type { Metadata } from 'next'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { SectionLabel } from '@/components/site/ui'
import { UnitCard } from '@/components/atlas/unit-card'
import { ATLAS_LEVELS, LEVEL_PLURAL, getAllUnits, type AtlasLevel } from '@/lib/atlas'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'NTL Atlas',
  description: "Explore NTL's zones, subzones and clusters: who lives there, what they need, and what we are doing about it.",
  alternates: { canonical: '/atlas' },
}
export const dynamic = 'force-dynamic'

export default async function AtlasPage({ searchParams }: { searchParams: Promise<{ q?: string; level?: string }> }) {
  const sp = await searchParams
  const q = (sp.q ?? '').trim().slice(0, 80)
  const level = ATLAS_LEVELS.find((l) => l === sp.level)

  const all = await getAllUnits()
  const byId = new Map(all.map((u) => [u.id, u]))
  const needle = q.toLowerCase()
  const shown = all.filter(
    (u) => (!level || u.level === level) && (!needle || u.name.toLowerCase().includes(needle) || u.code.toLowerCase().includes(needle)),
  )
  const counts = Object.fromEntries(ATLAS_LEVELS.map((l) => [l, all.filter((u) => u.level === l).length])) as Record<AtlasLevel, number>
  const filtering = !!q || !!level
  const pill = (active: boolean) =>
    cn('rounded-full px-4 py-1.5 text-sm font-medium', active ? 'bg-ink text-white' : 'bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50')
  const href = (l?: AtlasLevel) => `/atlas?${new URLSearchParams({ ...(q && { q }), ...(l && { level: l }) }).toString()}`

  return (
    <SiteShell>
      <PageHero title="NTL Atlas" description="Regional intelligence. Explore NTL's zones, subzones and clusters, and see the people, needs and opportunities in each." />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <dl className="grid grid-cols-3 gap-4">
          {ATLAS_LEVELS.map((l) => (
            <div key={l} className="rounded-2xl border border-line bg-white p-5 text-center shadow-sm">
              <dd className="text-gradient text-3xl font-semibold">{counts[l]}</dd>
              <dt className="mt-1 text-sm text-slate-600">{LEVEL_PLURAL[l]}</dt>
            </div>
          ))}
        </dl>

        <form action="/atlas" className="mt-8 flex flex-col gap-3 sm:flex-row" role="search">
          {level && <input type="hidden" name="level" value={level} />}
          <div className="relative flex-1">
            <label htmlFor="atlas-q" className="sr-only">Search by name or ID</label>
            <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <input id="atlas-q" name="q" defaultValue={q} placeholder="Search by name or ID, e.g. Z01" className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3.5 text-sm text-ink outline-none focus:border-brand-muted focus:ring-2 focus:ring-brand/30" />
          </div>
          <button type="submit" className="h-11 rounded-full bg-ink px-6 text-sm font-semibold text-white hover:bg-ink-3">Search</button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by level">
          <Link href={href()} className={pill(!level)}>All</Link>
          {ATLAS_LEVELS.map((l) => (
            <Link key={l} href={href(l)} aria-current={level === l ? 'true' : undefined} className={pill(level === l)}>{LEVEL_PLURAL[l]}</Link>
          ))}
        </div>

        {all.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
            The Atlas is being compiled. Check back soon.
          </p>
        ) : filtering ? (
          <section className="mt-10" aria-live="polite">
            <SectionLabel>{shown.length} result{shown.length === 1 ? '' : 's'}</SectionLabel>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((u) => (
                <UnitCard key={u.id} code={u.code} name={u.name} level={u.level} parent={u.parentId ? byId.get(u.parentId)?.name : null} summary={u.summary} />
              ))}
              {shown.length === 0 && <p className="col-span-full text-sm text-slate-600">Nothing matches. Try a different name or ID.</p>}
            </div>
          </section>
        ) : (
          ATLAS_LEVELS.map((l) => (
            <section key={l} className="mt-12">
              <SectionLabel>{LEVEL_PLURAL[l]}</SectionLabel>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {all.filter((u) => u.level === l).map((u) => (
                  <UnitCard key={u.id} code={u.code} name={u.name} level={u.level} parent={u.parentId ? byId.get(u.parentId)?.name : null} summary={u.summary} />
                ))}
                {counts[l] === 0 && <p className="col-span-full text-sm text-slate-600">None published yet.</p>}
              </div>
            </section>
          ))
        )}

        <p className="mt-14 rounded-2xl bg-brand/5 p-5 text-sm leading-relaxed text-slate-700 ring-1 ring-inset ring-brand/15">
          The Atlas is a directory first. An interactive boundary map is planned once verified boundary data is ready. Figures marked unverified are estimates or field assessments, and only aggregate information is published.
        </p>
      </div>
    </SiteShell>
  )
}
