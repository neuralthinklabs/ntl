import { count, desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { adminAuditLog, profiles } from '@/db/schema'
import { Pager } from '@/components/site/pager'
import { AdminHeader, EmptyState } from '@/components/admin/admin-header'
import { parsePage, totalPages } from '@/lib/pagination'

export const metadata = { title: 'Audit log' }
export const dynamic = 'force-dynamic'

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page, limit, offset } = parsePage(await searchParams)
  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select({ log: adminAuditLog, name: profiles.fullName, email: profiles.email })
      .from(adminAuditLog)
      .leftJoin(profiles, eq(adminAuditLog.actorId, profiles.id))
      .orderBy(desc(adminAuditLog.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(adminAuditLog),
  ])

  return (
    <>
      <AdminHeader title="Audit log" description="Every change made in the admin portal: who did what, and when (UTC)." />
      {rows.length === 0 ? (
        <EmptyState>Nothing logged yet.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <table className="w-full min-w-[720px] text-left">
            <thead className="text-xs text-slate-600">
              <tr>
                <th className="pb-2 pr-4 font-medium">When</th>
                <th className="pb-2 pr-4 font-medium">Who</th>
                <th className="pb-2 pr-4 font-medium">Action</th>
                <th className="pb-2 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ log, name, email }) => (
                <tr key={log.id} className="border-t border-slate-200 align-top">
                  <td className="py-2.5 pr-4 text-xs text-slate-600">
                    {log.createdAt.toLocaleString('en-GB', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="py-2.5 pr-4 text-sm text-ink">{name || email || 'Deleted user'}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-slate-700">{log.action}</td>
                  <td className="py-2.5 text-sm text-slate-600">
                    {log.entity}
                    {log.summary ? ` · ${log.summary}` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={page} totalPages={totalPages(total, limit)} basePath="/admin/audit" />
    </>
  )
}
