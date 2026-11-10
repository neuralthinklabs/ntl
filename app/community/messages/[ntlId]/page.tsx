import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { SiteShell } from '@/components/site/site-shell'
import { MessageThread } from '@/components/community/message-thread'
import { ActionButton } from '@/components/community/action-button'
import { getViewer } from '@/lib/community/authz'
import { getThreadMessages } from '@/lib/collab/queries'
import { canMessage, findConversation, loadPerson, markMessageNotificationsRead, markRead } from '@/lib/collab/messaging'
import { normalizeNtlId } from '@/lib/ntl-id'
import { blockUser } from '@/actions/community'

type Props = { params: Promise<{ ntlId: string }> }
export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Conversation', robots: { index: false, follow: false } }

export default async function ThreadPage({ params }: Props) {
  const { ntlId: raw } = await params
  const ntl = normalizeNtlId(raw)
  if (!ntl) notFound()
  const viewer = await getViewer()
  if (!viewer) redirect(`/auth/login?next=${encodeURIComponent(`/community/messages/${ntl}`)}`)
  const other = await loadPerson(ntl)
  if (!other) notFound()
  if (other.id === viewer.id) redirect('/community/messages')

  const conv = await findConversation(viewer.id, other.id)
  const messages = conv ? await getThreadMessages(conv.id) : []
  if (conv) {
    await markRead(conv.id, viewer.id)
    await markMessageNotificationsRead(viewer.id, other.id)
  }
  const decision = viewer.blocked ? ({ ok: false, error: 'Your community access is currently restricted.' } as const) : await canMessage(viewer, other)

  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link href="/community/messages" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-muted hover:underline"><ArrowLeft className="size-4" /> All messages</Link>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            <Link href={`/community/members/${other.ntlId}`} className="hover:underline">{other.name}</Link> <span className="font-mono text-sm font-normal text-slate-600">{other.ntlId}</span>
          </h1>
          <ActionButton action={blockUser.bind(null, other.id)} label="Block" confirm="Block this person? You will stop seeing their posts and they cannot message you." variant="danger" />
        </div>
        <div className="mt-6">
          <MessageThread
            ntlId={other.ntlId}
            canSend={decision.ok}
            blockedReason={decision.ok ? null : decision.error}
            initial={messages.map((m) => ({ id: m.id, mine: m.senderId === viewer.id, body: m.deletedAt ? '' : m.body, createdAt: m.createdAt.toISOString(), deleted: !!m.deletedAt }))}
          />
        </div>
      </div>
    </SiteShell>
  )
}
