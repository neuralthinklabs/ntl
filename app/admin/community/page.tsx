import Link from 'next/link'
import { asc, sql } from 'drizzle-orm'
import { db } from '@/db'
import { communities } from '@/db/community-schema'
import { AdminHeader, EmptyState } from '@/components/admin/admin-header'
import { KIND_LABEL, VISIBILITY_LABEL } from '@/lib/community/constants'

export const metadata = { title: 'Community groups' }
export const dynamic = 'force-dynamic'

export default async function AdminCommunityPage() {
  const rows = await db
    .select({ c: communities, members: sql<number>`(select count(*)::int from community_members m where m.community_id = ${communities.id} and m.status = 'active')` })
    .from(communities)
    .orderBy(asc(communities.name))
  return (
    <>
      <AdminHeader title="Community groups" description="Create and manage public groups, Atlas communities, project groups, learning communities and internal NTL workspaces." newHref="/admin/community/new" newLabel="New group" />
      <p className="mb-5 flex flex-wrap gap-4 text-sm"><Link href="/admin/community/moderation" className="font-medium text-brand-muted underline">Moderation: appeals, reports, people and logs</Link><Link href="/admin/community/messages" className="font-medium text-brand-muted underline">Reported messages</Link></p>
      <div className="flex flex-col gap-3">
        {rows.map(({ c, members }) => (
          <Link key={c.id} href={`/admin/community/${c.id}`} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{c.name}</p>
              <p className="mt-0.5 text-xs text-slate-600">{KIND_LABEL[c.kind]} · {VISIBILITY_LABEL[c.visibility]} · {members} member{members === 1 ? '' : 's'}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${c.archivedAt ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-800'}`}>{c.archivedAt ? 'Archived' : 'Active'}</span>
          </Link>
        ))}
        {rows.length === 0 && <EmptyState>No groups yet. Create the first one.</EmptyState>}
      </div>
    </>
  )
}
