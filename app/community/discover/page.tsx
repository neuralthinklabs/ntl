import type { Metadata } from 'next'
import Link from 'next/link'
import { Lock, Search } from 'lucide-react'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { Pager } from '@/components/site/pager'
import { JoinButton } from '@/components/community/join-button'
import { getViewer } from '@/lib/community/authz'
import { listCommunities } from '@/lib/community/queries'
import { ATLAS_SCOPES, ATLAS_SCOPE_LABEL, KIND_LABEL, KIND_PLURAL, PUBLIC_KINDS, groupHref } from '@/lib/community/constants'
import { parsePage, totalPages, DEFAULT_PAGE_SIZE } from '@/lib/pagination'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Discover communities', description: 'Find public communities, Atlas communities by place, project groups and learning communities.', alternates: { canonical: '/community/discover' } }
export const dynamic = 'force-dynamic'

const pill = (on: boolean) => cn('rounded-full px-4 py-1.5 text-sm font-medium', on ? 'bg-ink text-white' : 'bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50')

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<{ q?: string; kind?: string; scope?: string; page?: string }> }) {
  const sp = await searchParams
  const q = (sp.q ?? '').trim().slice(0, 80)
  const kind = PUBLIC_KINDS.find((k) => k === sp.kind)
  const scope = kind === 'atlas' ? ATLAS_SCOPES.find((s) => s === sp.scope) : undefined
  const { page } = parsePage(sp)
  const viewer = await getViewer()
  const { items, total } = await listCommunities({ viewerId: viewer?.id ?? null, q, kind, scope, page })
  const href = (o: { kind?: string; scope?: string }) => {
    const p = new URLSearchParams(Object.entries({ q, ...o }).filter(([, v]) => v) as [string, string][]).toString()
    return `/community/discover${p ? `?${p}` : ''}`
  }
  const basePath = href({ kind, scope })

  return (
    <SiteShell>
      <PageHero title="Discover communities" description="Interest groups, Atlas communities by place, project groups and learning communities." />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <form action="/community/discover" role="search" className="flex flex-col gap-3 sm:flex-row">
          {kind && <input type="hidden" name="kind" value={kind} />}
          {scope && <input type="hidden" name="scope" value={scope} />}
          <div className="relative flex-1">
            <label htmlFor="community-q" className="sr-only">Search groups</label>
            <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <input id="community-q" name="q" defaultValue={q} placeholder="Search by group name" className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3.5 text-sm text-ink outline-none focus:border-brand-muted focus:ring-2 focus:ring-brand/30" />
          </div>
          <button type="submit" className="h-11 rounded-full bg-ink px-6 text-sm font-semibold text-white hover:bg-ink-3">Search</button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by type">
          <Link href={href({})} className={pill(!kind)}>All</Link>
          {PUBLIC_KINDS.map((k) => <Link key={k} href={href({ kind: k })} className={pill(kind === k)} aria-current={kind === k ? 'true' : undefined}>{KIND_PLURAL[k]}</Link>)}
        </div>
        {kind === 'atlas' && (
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter by Atlas scope">
            <Link href={href({ kind })} className={pill(!scope)}>All places</Link>
            {ATLAS_SCOPES.map((s) => <Link key={s} href={href({ kind, scope: s })} className={pill(scope === s)}>{ATLAS_SCOPE_LABEL[s]}</Link>)}
          </div>
        )}

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.length === 0 && <p className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">No communities match yet.</p>}
          {items.map((g) => (
            <article key={g.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="rounded-full bg-brand-soft px-2.5 py-0.5 font-medium text-brand-muted">{KIND_LABEL[g.kind]}{g.atlasScope ? ` · ${ATLAS_SCOPE_LABEL[g.atlasScope]}` : ''}</span>
                {g.visibility === 'private' && <span className="inline-flex items-center gap-1 text-slate-600"><Lock className="size-3" /> Private</span>}
              </div>
              <h2 className="mt-3 text-base font-semibold text-ink"><Link href={groupHref(g)} className="hover:underline">{g.name}</Link></h2>
              {g.description && <p className="mt-1.5 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">{g.description}</p>}
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-600">{g.members} member{g.members === 1 ? '' : 's'}</span>
                <JoinButton communityId={g.id} loggedIn={!!viewer} status={g.myStatus} nextPath="/community/discover" compact />
              </div>
            </article>
          ))}
        </div>
        <Pager page={page} totalPages={totalPages(total, DEFAULT_PAGE_SIZE)} basePath={basePath} />
      </div>
    </SiteShell>
  )
}
