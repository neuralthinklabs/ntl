import { count, desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { profiles, volunteerApplications } from '@/db/schema'
import { Pager } from '@/components/site/pager'
import { VolunteerRow } from '@/components/admin/volunteer-row'
import { AdminHeader, EmptyState, FilterPills } from '@/components/admin/admin-header'
import { parsePage, totalPages } from '@/lib/pagination'
import { formatDate } from '@/lib/datetime'
import { goalIndexBySlug, goals } from '@/lib/ntldgs'

export const metadata = { title: 'Volunteer applications' }
export const dynamic = 'force-dynamic'

const STATUSES = ['new', 'reviewing', 'accepted', 'declined'] as const

export default async function AdminVolunteersPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
  const sp = await searchParams
  const { page, limit, offset } = parsePage(sp)
  const status = STATUSES.find((s) => s === sp.status)
  const where = status ? eq(volunteerApplications.status, status) : undefined

  const [rows, [{ value: total }]] = await Promise.all([
    db
      .select({ a: volunteerApplications, email: profiles.email })
      .from(volunteerApplications)
      .innerJoin(profiles, eq(volunteerApplications.userId, profiles.id))
      .where(where)
      .orderBy(desc(volunteerApplications.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ value: count() }).from(volunteerApplications).where(where),
  ])

  return (
    <>
      <AdminHeader title="Volunteer applications" description="Applications from the Volunteer page. Accepting one gives that person the volunteer workspace, ready for assignments." />
      <FilterPills basePath="/admin/volunteers" current={status ?? 'all'} options={[{ value: 'all', label: 'All' }, ...STATUSES.map((s) => ({ value: s, label: s }))]} />
      <div className="flex flex-col gap-4">
        {rows.map(({ a, email }) => (
          <VolunteerRow
            key={a.id}
            id={a.id}
            name={a.fullName}
            email={email}
            phone={a.phone}
            location={a.location}
            skills={a.skills}
            goals={a.ntldgSlugs.map((s) => goalIndexBySlug(s)).filter((i) => i >= 0).map((i) => `${goals[i].verb}`)}
            hours={a.hoursPerWeek}
            availability={a.availability}
            experience={a.experience}
            motivation={a.motivation}
            links={a.links}
            status={a.status}
            adminNotes={a.adminNotes ?? ''}
            date={formatDate(a.createdAt)}
          />
        ))}
        {rows.length === 0 && <EmptyState>No applications here.</EmptyState>}
      </div>
      <Pager page={page} totalPages={totalPages(total, limit)} basePath={status ? `/admin/volunteers?status=${status}` : '/admin/volunteers'} />
    </>
  )
}
