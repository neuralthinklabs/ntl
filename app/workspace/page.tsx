import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { getViewer } from '@/lib/community/authz'
import { getMyGroups } from '@/lib/community/queries'
import { KIND_LABEL, ROLE_LABEL, groupHref } from '@/lib/community/constants'

export const metadata: Metadata = { title: 'NTL workspace', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function WorkspacePage() {
  const viewer = await getViewer()
  if (!viewer) redirect('/auth/login?next=/workspace')
  const groups = await getMyGroups(viewer.id, true, viewer.isAdmin)
  // People with no internal membership get a plain 404: the workspace does not exist for them.
  if (groups.length === 0) notFound()
  return (
    <SiteShell>
      <PageHero title="NTL workspace" description="Private, permission-controlled spaces for the core team, departments, leadership, zone leaders and operations." />
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <ul className="grid gap-4 sm:grid-cols-2">
          {groups.map((g) => (
            <li key={g.id}>
              <Link href={groupHref(g)} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-muted">{KIND_LABEL[g.kind]}</span>
                <span className="mt-1 text-base font-semibold text-ink">{g.name}</span>
                {g.description && <span className="mt-1.5 line-clamp-3 text-sm text-slate-600">{g.description}</span>}
                <span className="mt-3 text-xs text-slate-600">Your role: {g.role === 'admin' ? 'NTL admin' : ROLE_LABEL[g.role]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </SiteShell>
  )
}
