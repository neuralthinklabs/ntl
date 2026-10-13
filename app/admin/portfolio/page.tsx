import Link from 'next/link'
import { AdminHeader, EmptyState } from '@/components/admin/admin-header'
import { getAllPortfolioItems } from '@/lib/portfolio'

export const metadata = { title: 'Portfolio' }

export default async function AdminPortfolioPage() {
  const rows = await getAllPortfolioItems()
  return (
    <>
      <AdminHeader title="Portfolio" description="Products, services and ventures on the Portfolio page." newHref="/admin/portfolio/new" newLabel="Add item" />
      <div className="flex flex-col gap-3">
        {rows.map((p) => (
          <Link key={p.id} href={`/admin/portfolio/${p.id}`} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{p.name}</p>
              <p className="mt-0.5 text-xs text-slate-600">{p.type} · {p.status}</p>
            </div>
            <span className="shrink-0 text-xs text-slate-500">#{p.sortOrder}</span>
          </Link>
        ))}
        {rows.length === 0 && <EmptyState>No portfolio items yet.</EmptyState>}
      </div>
    </>
  )
}
