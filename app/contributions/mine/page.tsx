import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { count, desc, eq } from 'drizzle-orm'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { contributions } from '@/db/schema'
import { money } from '@/lib/format'
import { Pager } from '@/components/site/pager'
import { parsePage, totalPages } from '@/lib/pagination'

export const metadata: Metadata = { title: 'My pledges', robots: { index: false } }

const LABEL: Record<string, { text: string; cls: string }> = {
  pledged: { text: 'Awaiting payment', cls: 'bg-amber-100 text-amber-800' },
  confirmed: { text: 'Payment confirmed', cls: 'bg-emerald-100 text-emerald-800' },
  rejected: { text: 'Not taken forward', cls: 'bg-slate-200 text-slate-700' },
  refunded: { text: 'Refunded', cls: 'bg-red-100 text-red-700' },
}

export default async function MyPledgesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page, limit, offset } = parsePage(await searchParams)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/contributions/mine')

  const [rows, [{ value: total }]] = await Promise.all([
    db.query.contributions.findMany({
      where: eq(contributions.userId, user.id),
      orderBy: [desc(contributions.createdAt)],
      with: { goal: true },
      limit,
      offset,
    }),
    db.select({ value: count() }).from(contributions).where(eq(contributions.userId, user.id)),
  ])

  return (
    <SiteShell>
      <PageHero title="My pledges" description="Your pledges and whether we've confirmed the payment." />
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">You haven&apos;t pledged to a campaign yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{money(c.amountCents ?? 0)} · {c.goal?.title ?? 'Campaign'}</p>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {c.createdAt.toLocaleDateString('en-US', { timeZone: 'UTC' })} · ref {c.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${LABEL[c.status]?.cls ?? ''}`}>{LABEL[c.status]?.text ?? c.status}</span>
              </li>
            ))}
          </ul>
        )}
        <Pager page={page} totalPages={totalPages(total, limit)} basePath="/contributions/mine" />
      </div>
    </SiteShell>
  )
}
