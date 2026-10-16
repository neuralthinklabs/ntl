import { notFound } from 'next/navigation'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { portfolioContributors, portfolioItems, profiles } from '@/db/schema'
import { AdminHeader } from '@/components/admin/admin-header'
import { PortfolioForm } from '@/components/admin/portfolio-form'
import { DeleteButton } from '@/components/admin/delete-button'
import { ContributorEditor } from '@/components/admin/campaign-contributors'
import { deletePortfolioItem } from '@/actions/admin/portfolio'
import { addPortfolioContributor, removePortfolioContributor } from '@/actions/admin/contributors'

export const metadata = { title: 'Edit portfolio item' }

export default async function EditPortfolioPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params
  const { created } = await searchParams
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const p = await db.query.portfolioItems.findFirst({ where: eq(portfolioItems.id, id) })
  if (!p) notFound()

  const people = await db
    .select({ userId: profiles.id, name: profiles.fullName, email: profiles.email, ntlId: profiles.ntlId, showCredit: profiles.showCredit, roleLabel: portfolioContributors.roleLabel })
    .from(portfolioContributors)
    .innerJoin(profiles, eq(portfolioContributors.userId, profiles.id))
    .where(eq(portfolioContributors.portfolioItemId, id))
    .orderBy(asc(portfolioContributors.createdAt))

  return (
    <>
      <AdminHeader title="Edit portfolio item" />
      {created && <p role="status" className="mb-4 rounded-lg bg-brand/10 px-3.5 py-2.5 text-sm text-brand-muted">Item added.</p>}
      <div className="flex flex-col gap-6">
        <PortfolioForm initial={{ id: p.id, name: p.name, type: p.type, status: p.status, description: p.description, sortOrder: String(p.sortOrder) }} />
        <ContributorEditor
          contributors={people.map((c) => ({ userId: c.userId, name: c.name || c.email, ntlId: c.ntlId, roleLabel: c.roleLabel, hidden: !c.showCredit }))}
          add={addPortfolioContributor.bind(null, p.id)}
          remove={removePortfolioContributor.bind(null, p.id)}
          where="this project"
        />
        <div>
          <DeleteButton action={deletePortfolioItem.bind(null, p.id)} what={`“${p.name}”`} label="Delete item" />
        </div>
      </div>
    </>
  )
}
