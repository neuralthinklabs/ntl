import Link from 'next/link'
import { desc } from 'drizzle-orm'
import { db } from '@/db'
import { goals } from '@/db/schema'
import { AdminHeader, EmptyState } from '@/components/admin/admin-header'
import { money } from '@/lib/format'
import { percentFunded } from '@/lib/goals'

export const metadata = { title: 'Campaigns' }

export default async function AdminCampaignsPage() {
  const rows = await db.query.goals.findMany({ orderBy: [desc(goals.createdAt)] })
  return (
    <>
      <AdminHeader title="Campaigns" description="Funding campaigns shown on the Support page." newHref="/admin/campaigns/new" newLabel="New campaign" />
      <div className="flex flex-col gap-3">
        {rows.map((g) => (
          <Link key={g.id} href={`/admin/campaigns/${g.id}`} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{g.title}</p>
              <p className="mt-0.5 text-xs text-slate-600">{money(g.fundingRaisedCents)} of {money(g.fundingTargetCents)} ({percentFunded(g)}%)</p>
            </div>
            <span className="shrink-0 text-xs capitalize text-slate-600">{g.status.replace('_', ' ')}</span>
          </Link>
        ))}
        {rows.length === 0 && <EmptyState>No campaigns yet.</EmptyState>}
      </div>
    </>
  )
}
