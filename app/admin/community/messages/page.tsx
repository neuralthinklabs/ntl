import Link from 'next/link'
import { AdminHeader, EmptyState } from '@/components/admin/admin-header'
import { ActionButton } from '@/components/community/action-button'
import { getOpenDmReports } from '@/lib/collab/queries'
import { closeDmReport } from '@/actions/admin/messages'
import { REPORT_LABEL } from '@/lib/community/constants'
import { formatDate } from '@/lib/datetime'

export const metadata = { title: 'Reported messages' }
export const dynamic = 'force-dynamic'

export default async function AdminReportedMessagesPage() {
  const reports = await getOpenDmReports()
  return (
    <>
      <AdminHeader title="Reported messages" description="You see only the reported message and a few before it. To act on the person, use Moderation > People (suspend or ban) with their NTL ID." />
      <p className="mb-5 text-sm"><Link href="/admin/community/moderation" className="font-medium text-brand-muted underline">Community moderation</Link></p>
      <div className="flex flex-col gap-4">
        {reports.length === 0 && <EmptyState>No open reports.</EmptyState>}
        {reports.map((r) => (
          <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
            <p className="text-xs text-slate-600">{REPORT_LABEL[r.reason] ?? r.reason} · {formatDate(r.createdAt)} · reported by <span className="font-mono">{r.reporter ?? 'unknown'}</span> · about <span className="font-mono">{r.reported ?? 'unknown'}</span></p>
            {r.details && <p className="mt-2 text-slate-800">Reporter says: {r.details}</p>}
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-800">{r.snapshot}</pre>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ActionButton action={closeDmReport.bind(null, r.id, 'resolved')} label="Mark resolved" promptLabel="Note (optional):" variant="primary" />
              <ActionButton action={closeDmReport.bind(null, r.id, 'dismissed')} label="Dismiss" promptLabel="Note (optional):" />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
