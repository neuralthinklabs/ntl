import type { Metadata } from 'next'
import { desc, count } from 'drizzle-orm'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { Pager } from '@/components/site/pager'
import { db } from '@/db'
import { contactEnquiries } from '@/db/schema'
import { AdminContactRow } from '@/components/admin/admin-contact-row'
import { requireAdminPage } from '@/lib/auth/admin'
import { parsePage, totalPages } from '@/lib/pagination'

export const metadata: Metadata = {
  title: 'Review Contact Enquiries — Admin',
}

export default async function AdminContactPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  await requireAdminPage('/admin/contact')

  const { page, limit, offset } = parsePage(await searchParams)

  const [all, [{ value: totalCount }]] = await Promise.all([
    db.query.contactEnquiries.findMany({
      orderBy: [desc(contactEnquiries.createdAt)],
      limit,
      offset,
    }),
    db.select({ value: count() }).from(contactEnquiries),
  ])

  return (
    <SiteShell>
      <PageHero
        title="Review Contact Enquiries"
        description="Messages submitted through the public contact form."
      />
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="flex flex-col gap-4">
          {all.map((e) => (
            <AdminContactRow
              key={e.id}
              id={e.id}
              name={e.name}
              email={e.email}
              message={e.message}
              submittedAt={new Date(e.createdAt).toLocaleDateString()}
              handled={e.handled}
            />
          ))}
          {all.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              No enquiries yet.
            </p>
          )}
        </div>
        <Pager page={page} totalPages={totalPages(totalCount, limit)} basePath="/admin/contact" />
      </div>
    </SiteShell>
  )
}
