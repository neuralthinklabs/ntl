import { desc, count } from 'drizzle-orm'
import { db } from '@/db'
import { contactEnquiries } from '@/db/schema'
import { Pager } from '@/components/site/pager'
import { AdminContactRow } from '@/components/admin/admin-contact-row'
import { AdminHeader, EmptyState } from '@/components/admin/admin-header'
import { parsePage, totalPages } from '@/lib/pagination'

export const metadata = { title: 'Contact messages' }

export default async function AdminContactPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page, limit, offset } = parsePage(await searchParams)
  const [all, [{ value: total }]] = await Promise.all([
    db.query.contactEnquiries.findMany({ orderBy: [desc(contactEnquiries.createdAt)], limit, offset }),
    db.select({ value: count() }).from(contactEnquiries),
  ])

  return (
    <>
      <AdminHeader title="Contact messages" description="Messages sent through the public contact form." />
      <div className="flex flex-col gap-4">
        {all.map((e) => (
          <AdminContactRow
            key={e.id}
            id={e.id}
            name={e.name}
            email={e.email}
            message={e.message}
            submittedAt={new Date(e.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC' })}
            handled={e.handled}
          />
        ))}
        {all.length === 0 && <EmptyState>No messages yet.</EmptyState>}
      </div>
      <Pager page={page} totalPages={totalPages(total, limit)} basePath="/admin/contact" />
    </>
  )
}
