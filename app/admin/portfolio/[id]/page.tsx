import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { portfolioItems } from '@/db/schema'
import { AdminHeader } from '@/components/admin/admin-header'
import { PortfolioForm } from '@/components/admin/portfolio-form'
import { DeleteButton } from '@/components/admin/delete-button'
import { deletePortfolioItem } from '@/actions/admin/portfolio'

export const metadata = { title: 'Edit portfolio item' }

export default async function EditPortfolioPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params
  const { created } = await searchParams
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const p = await db.query.portfolioItems.findFirst({ where: eq(portfolioItems.id, id) })
  if (!p) notFound()
  return (
    <>
      <AdminHeader title="Edit portfolio item" />
      {created && <p role="status" className="mb-4 rounded-lg bg-brand/10 px-3.5 py-2.5 text-sm text-brand-muted">Item added.</p>}
      <PortfolioForm initial={{ id: p.id, name: p.name, type: p.type, status: p.status, description: p.description, sortOrder: String(p.sortOrder) }} />
      <div className="mt-6">
        <DeleteButton action={deletePortfolioItem.bind(null, p.id)} what={`“${p.name}”`} label="Delete item" />
      </div>
    </>
  )
}
