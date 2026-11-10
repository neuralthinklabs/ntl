import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { NewMessageForm } from '@/components/community/new-message-form'
import { getViewer } from '@/lib/community/authz'
import { getConversations } from '@/lib/collab/queries'
import { formatDate } from '@/lib/datetime'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Messages', robots: { index: false } }
export const dynamic = 'force-dynamic'

export default async function MessagesPage() {
  const viewer = await getViewer()
  if (!viewer) redirect('/auth/login?next=/community/messages')
  const items = await getConversations(viewer.id)
  return (
    <SiteShell>
      <PageHero title="Messages" description="Private conversations with people you share a group with." />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <NewMessageForm />
        <ul className="mt-8 flex flex-col gap-3">
          {items.length === 0 && <li className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">No conversations yet. Open a member&apos;s profile from a group and press Message.</li>}
          {items.map((c) => (
            <li key={c.id}>
              <Link href={`/community/messages/${c.otherNtlId}`} className={cn('flex items-center justify-between gap-4 rounded-2xl border p-4 shadow-sm hover:shadow-md', c.unread ? 'border-brand/40 bg-brand-soft' : 'border-slate-200 bg-white')}>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">{c.otherName} <span className="font-mono text-xs font-normal text-slate-600">{c.otherNtlId}</span></span>
                  <span className="block truncate text-xs text-slate-600">{c.lastDeleted ? 'Message deleted' : c.lastBody}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1 text-xs text-slate-600">
                  {formatDate(c.lastMessageAt)}
                  {c.unread > 0 && <span className="rounded-full bg-brand px-2 py-0.5 font-semibold text-brand-foreground">{c.unread} new</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-xs text-slate-600">Messages are private to you and the other person. If someone reports a message, NTL administrators can read that message and the few before it. You can block anyone from their profile.</p>
      </div>
    </SiteShell>
  )
}
