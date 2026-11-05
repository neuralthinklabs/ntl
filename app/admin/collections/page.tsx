import Link from 'next/link'
import { desc } from 'drizzle-orm'
import { db } from '@/db'
import { collections } from '@/db/collections-schema'
import { AdminHeader, EmptyState } from '@/components/admin/admin-header'
import { COLLECTION_LABEL } from '@/lib/collection-constants'

export const metadata = { title: 'Series & magazines' }
export const dynamic = 'force-dynamic'

export default async function AdminCollectionsPage() {
  const rows = await db.select().from(collections).orderBy(desc(collections.updatedAt))
  const now = new Date()
  return (
    <>
      <AdminHeader title="Series & magazines" description="Group stories into numbered series or magazine issues." newHref="/admin/collections/new" newLabel="New" />
      <div className="flex flex-col gap-3">
        {rows.map((c) => {
          const live = c.publishedAt && c.publishedAt <= now
          return (
            <Link key={c.id} href={`/admin/collections/${c.id}`} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{c.title}</p>
                <p className="mt-0.5 text-xs text-slate-600">{COLLECTION_LABEL[c.kind]}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${live ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                {live ? 'Published' : 'Draft'}
              </span>
            </Link>
          )
        })}
        {rows.length === 0 && <EmptyState>Nothing yet. Create your first series or magazine.</EmptyState>}
      </div>
    </>
  )
}
