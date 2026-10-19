import Link from 'next/link'
import { asc } from 'drizzle-orm'
import { db } from '@/db'
import { atlasUnits } from '@/db/schema'
import { AdminHeader, EmptyState } from '@/components/admin/admin-header'
import { LEVEL_LABEL } from '@/lib/atlas-constants'

export const metadata = { title: 'Atlas' }
export const dynamic = 'force-dynamic'

export default async function AdminAtlasPage() {
  const rows = await db.query.atlasUnits.findMany({ orderBy: [asc(atlasUnits.code)] })
  const name = new Map(rows.map((r) => [r.id, r.name]))
  return (
    <>
      <AdminHeader title="Atlas" description="Zones, subzones and clusters. Only published items appear on the public Atlas." newHref="/admin/atlas/new" newLabel="Add unit" />
      <div className="flex flex-col gap-3">
        {rows.map((r) => (
          <Link key={r.id} href={`/admin/atlas/${r.id}`} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink"><span className="font-mono text-slate-600">{r.code}</span> · {r.name}</p>
              <p className="mt-0.5 text-xs text-slate-600">{LEVEL_LABEL[r.level]}{r.parentId ? ` in ${name.get(r.parentId)}` : ''}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${r.published ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>{r.published ? 'Published' : 'Draft'}</span>
          </Link>
        ))}
        {rows.length === 0 && <EmptyState>No units yet. Start with a zone.</EmptyState>}
      </div>
    </>
  )
}
