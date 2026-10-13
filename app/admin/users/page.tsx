import { desc, count } from 'drizzle-orm'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { Pager } from '@/components/site/pager'
import { AdminHeader } from '@/components/admin/admin-header'
import { UserRow } from '@/components/admin/user-row'
import { parsePage, totalPages } from '@/lib/pagination'
import { getCurrentUserAndProfile } from '@/lib/auth/admin'

export const metadata = { title: 'Users' }

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page, limit, offset } = parsePage(await searchParams)
  const [{ user }, rows, [{ value: total }]] = await Promise.all([
    getCurrentUserAndProfile(),
    db.query.profiles.findMany({ orderBy: [desc(profiles.createdAt)], limit, offset }),
    db.select({ value: count() }).from(profiles),
  ])
  return (
    <>
      <AdminHeader title="Users" description="Give trusted people admin access, or take it away." />
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <table className="w-full min-w-[640px] text-left">
          <thead className="text-xs text-slate-600">
            <tr>
              <th className="pb-2 pr-4 font-medium">Name</th><th className="pb-2 pr-4 font-medium">Email</th>
              <th className="pb-2 pr-4 font-medium">Points</th><th className="pb-2 pr-4 font-medium">Joined</th><th className="pb-2 font-medium">Role</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <UserRow key={u.id} id={u.id} name={u.fullName ?? ''} email={u.email} role={u.role} points={u.points} joined={u.createdAt.toLocaleDateString('en-US', { timeZone: 'UTC' })} isSelf={u.id === user?.id} />
            ))}
          </tbody>
        </table>
      </div>
      <Pager page={page} totalPages={totalPages(total, limit)} basePath="/admin/users" />
    </>
  )
}
