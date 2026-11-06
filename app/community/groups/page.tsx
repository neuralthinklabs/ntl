import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { getViewer } from '@/lib/community/authz'
import { getMyGroups } from '@/lib/community/queries'
import { KIND_LABEL, ROLE_LABEL, groupHref } from '@/lib/community/constants'

export const metadata: Metadata = { title: 'My groups', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function MyGroupsPage() {
  const viewer = await getViewer()
  if (!viewer) redirect('/auth/login?next=/community/groups')
  const [groups, internal] = await Promise.all([getMyGroups(viewer.id, false), getMyGroups(viewer.id, true, viewer.isAdmin)])
  const active = groups.filter((g) => g.status === 'active' || g.status === 'suspended')
  const pending = groups.filter((g) => g.status === 'pending')

  return (
    <SiteShell>
      <PageHero title="My groups" description="Groups you belong to, requests waiting for approval, and your internal workspace if you have one." />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        {internal.length > 0 && (
          <section className="mb-10 rounded-2xl bg-ink p-6 text-white">
            <h2 className="text-base font-semibold">NTL workspace</h2>
            <p className="mt-1 text-sm text-white/70">Private spaces for the people running NTL. Only you and invited members can see them.</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {internal.map((g) => (
                <li key={g.id}><Link href={groupHref(g)} className="block rounded-xl bg-white/10 p-3 text-sm font-medium hover:bg-white/15">{g.name}<span className="block text-xs font-normal text-white/60">{KIND_LABEL[g.kind]} · {g.role === 'admin' ? 'Admin' : ROLE_LABEL[g.role]}</span></Link></li>
              ))}
            </ul>
          </section>
        )}
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Joined ({active.length})</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {active.length === 0 && <li className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">You have not joined a group yet. <Link href="/community/discover" className="font-medium text-brand-muted underline">Discover groups</Link>.</li>}
          {active.map((g) => (
            <li key={g.id}>
              <Link href={groupHref(g)} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md">
                <span className="min-w-0"><span className="block truncate text-sm font-semibold text-ink">{g.name}</span><span className="text-xs text-slate-600">{KIND_LABEL[g.kind]} · {ROLE_LABEL[g.role]}{g.status === 'suspended' ? ' · suspended' : ''}</span></span>
                <span className="shrink-0 text-xs font-medium text-brand-muted">Open</span>
              </Link>
            </li>
          ))}
        </ul>
        {pending.length > 0 && (
          <>
            <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-slate-600">Waiting for approval ({pending.length})</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {pending.map((g) => <li key={g.id} className="rounded-2xl border border-amber-200 bg-white p-4 text-sm text-ink">{g.name} <span className="text-xs text-slate-600">· a leader will review your request</span></li>)}
            </ul>
          </>
        )}
      </div>
    </SiteShell>
  )
}
