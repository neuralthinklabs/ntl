import Link from 'next/link'
import { AdminHeader, EmptyState } from '@/components/admin/admin-header'
import { AppealDecision, PersonActionForm } from '@/components/admin/community-admin-tools'
import { ActionButton } from '@/components/community/action-button'
import { getModLog, getOpenReports, getPendingAppeals } from '@/lib/community/queries'
import { removeComment, removePost, closeReport } from '@/actions/community-manage'
import { MOD_ACTION_LABEL } from '@/lib/community/constants'
import { formatDate } from '@/lib/datetime'

export const metadata = { title: 'Community moderation' }
export const dynamic = 'force-dynamic'

export default async function AdminModerationPage() {
  const [appeals, reports, log] = await Promise.all([getPendingAppeals(), getOpenReports({}), getModLog({ limit: 50 })])
  return (
    <>
      <AdminHeader title="Community moderation" description="Appeals, open reports across every group, platform-wide actions on people, and the full moderation log." />

      <h2 className="text-base font-semibold text-ink">Appeals ({appeals.length})</h2>
      <div className="mt-3 flex flex-col gap-3">
        {appeals.length === 0 && <EmptyState>No appeals waiting.</EmptyState>}
        {appeals.map((a) => (
          <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-ink">{a.userName} appeals: {MOD_ACTION_LABEL[a.action] ?? a.action}{a.communityName ? ` in ${a.communityName}` : ''}</p>
            {a.reason && <p className="mt-1 text-xs text-slate-600">Original reason: {a.reason}</p>}
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{a.message}</p>
            <AppealDecision appealId={a.id} />
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-base font-semibold text-ink">Open reports ({reports.length})</h2>
      <div className="mt-3 flex flex-col gap-3">
        {reports.length === 0 && <EmptyState>No open reports.</EmptyState>}
        {reports.map((r) => (
          <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
            <p className="text-xs text-slate-600">{r.communityName} · {r.reason.replace('_', ' ')} · {formatDate(r.createdAt)}</p>
            <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-slate-800">{r.postId ? (r.postTitle ? `${r.postTitle}: ` : '') + (r.postBody ?? '') : r.commentBody}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {r.postId && <Link href={`/community/post/${r.postId}`} className="text-xs font-medium text-brand-muted underline">Open post</Link>}
              {r.postId && <ActionButton action={removePost.bind(null, r.postId)} label="Remove content" promptLabel="Why is this being removed? The author will see this." variant="danger" />}
              {r.commentId && <ActionButton action={removeComment.bind(null, r.commentId)} label="Remove comment" promptLabel="Why is this being removed? The author will see this." variant="danger" />}
              <ActionButton action={closeReport.bind(null, r.id, 'dismissed')} label="Dismiss" promptLabel="Note (optional):" />
              <ActionButton action={closeReport.bind(null, r.id, 'resolved')} label="Mark resolved" promptLabel="Note (optional):" />
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-base font-semibold text-ink">People</h2>
      <p className="mb-3 mt-1 text-sm text-slate-600">Verified contributors skip post approval and can post events. Suspensions and bans here apply to every group.</p>
      <PersonActionForm />

      <h2 className="mt-10 text-base font-semibold text-ink">Moderation log</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {log.length === 0 && <li className="text-sm text-slate-600">Nothing logged yet.</li>}
        {log.map((l) => (
          <li key={l.id} className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700">
            <span className="font-semibold text-ink">{MOD_ACTION_LABEL[l.action] ?? l.action}</span>{l.communityName ? ` · ${l.communityName}` : ' · community-wide'} · by {l.actorName ?? 'unknown'}{l.targetName ? ` · on ${l.targetName}` : ''} · {formatDate(l.createdAt)}
            {l.reason && <span className="block text-slate-600">Reason: {l.reason}</span>}
          </li>
        ))}
      </ul>
    </>
  )
}
