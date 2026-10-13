import { count, desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { contributions } from '@/db/schema'
import { Pager } from '@/components/site/pager'
import { ContributionRow } from '@/components/admin/contribution-row'
import { AdminHeader, EmptyState, FilterPills } from '@/components/admin/admin-header'
import { parsePage, totalPages } from '@/lib/pagination'
import { money } from '@/lib/format'

export const metadata = { title: 'Pledges & payments' }

const STATUSES = ['pledged', 'confirmed', 'rejected', 'refunded'] as const

export default async function AdminContributionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>
}) {
  const sp = await searchParams
  const { page, limit, offset } = parsePage(sp)
  const status = STATUSES.find((s) => s === sp.status) ?? 'pledged'

  const [rows, [{ value: total }]] = await Promise.all([
    db.query.contributions.findMany({
      where: eq(contributions.status, status),
      orderBy: [desc(contributions.createdAt)],
      with: { user: true, goal: true },
      limit,
      offset,
    }),
    db.select({ value: count() }).from(contributions).where(eq(contributions.status, status)),
  ])

  return (
    <>
      <AdminHeader
        title="Pledges & payments"
        description="A campaign's progress bar only changes when you confirm that a payment arrived."
      />
      <FilterPills
        basePath="/admin/contributions"
        current={status}
        options={STATUSES.map((s) => ({ value: s, label: s }))}
      />
      <div className="flex flex-col gap-4">
        {rows.map((c) => (
          <ContributionRow
            key={c.id}
            id={c.id}
            who={c.user?.fullName ? `${c.user.fullName} (${c.user.email})` : (c.user?.email ?? 'unknown')}
            campaign={c.goal?.title ?? 'Deleted campaign'}
            amount={money(c.amountCents ?? 0)}
            status={c.status}
            pledgeRef={c.id.slice(0, 8).toUpperCase()}
            paymentRef={c.paymentRef}
            note={c.note}
            date={new Date(c.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC' })}
          />
        ))}
        {rows.length === 0 && <EmptyState>Nothing here.</EmptyState>}
      </div>
      <Pager page={page} totalPages={totalPages(total, limit)} basePath={`/admin/contributions?status=${status}`} />
    </>
  )
}
