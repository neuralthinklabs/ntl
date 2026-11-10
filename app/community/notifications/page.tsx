import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { Pager } from '@/components/site/pager'
import { ActionButton } from '@/components/community/action-button'
import { getViewer } from '@/lib/community/authz'
import { getBlockedPeople, getNotifications } from '@/lib/community/queries'
import { markAllNotificationsRead, markNotificationRead, unblockUser } from '@/actions/community'
import { parsePage, totalPages, DEFAULT_PAGE_SIZE } from '@/lib/pagination'
import { formatDate } from '@/lib/datetime'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Notifications', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const viewer = await getViewer()
  if (!viewer) redirect('/auth/login?next=/community/notifications')
  const { page } = parsePage(await searchParams)
  const [{ items, total }, blocked] = await Promise.all([getNotifications(viewer.id, page), getBlockedPeople(viewer.id)])
  const unread = items.filter((n) => !n.readAt).length

  return (
    <SiteShell>
      <PageHero title="Notifications" description="Replies, approvals, announcements and moderation updates from your groups." />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <p className="text-sm text-slate-600">{unread > 0 ? `${unread} unread on this page` : 'You are all caught up.'}</p>
          {unread > 0 && <ActionButton action={markAllNotificationsRead} label="Mark all read" />}
        </div>
        <ul className="flex flex-col gap-3">
          {items.length === 0 && <li className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">Nothing yet. Join a group and say hello.</li>}
          {items.map((n) => (
            <li key={n.id} className={cn('rounded-2xl border p-4 shadow-sm', n.readAt ? 'border-slate-200 bg-white' : 'border-brand/40 bg-brand-soft')}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  {n.link ? <Link href={n.link} className="text-sm font-semibold text-ink hover:underline">{n.title}</Link> : <p className="text-sm font-semibold text-ink">{n.title}</p>}
                  {n.body && <p className="mt-1 line-clamp-3 text-sm text-slate-700">{n.body}</p>}
                  <p className="mt-1 text-xs text-slate-600">{formatDate(n.createdAt)}</p>
                </div>
                {!n.readAt && <ActionButton action={markNotificationRead.bind(null, n.id)} label="Mark read" variant="link" />}
              </div>
            </li>
          ))}
        </ul>
        <Pager page={page} totalPages={totalPages(total, DEFAULT_PAGE_SIZE)} basePath="/community/notifications" />

        <section className="mt-14">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">People you blocked</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {blocked.length === 0 && <li className="text-sm text-slate-600">You have not blocked anyone.</li>}
            {blocked.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm">
                <span>{b.name} <span className="font-mono text-xs text-slate-600">{b.ntlId}</span></span>
                <ActionButton action={unblockUser.bind(null, b.id)} label="Unblock" />
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm"><Link href="/community/appeals" className="font-medium text-brand-muted underline">Moderation decisions about you and appeals</Link></p>
          <p className="mt-2 text-sm"><Link href="/community/settings" className="font-medium text-brand-muted underline">Email digest settings</Link></p>
        </section>
      </div>
    </SiteShell>
  )
}
