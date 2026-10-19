import { notFound } from 'next/navigation'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { atlasUnits } from '@/db/schema'
import { AdminHeader } from '@/components/admin/admin-header'
import { AtlasForm } from '@/components/admin/atlas-form'
import { DeleteButton } from '@/components/admin/delete-button'
import { deleteAtlasUnit } from '@/actions/admin/atlas'

export const metadata = { title: 'Edit Atlas unit' }
export const dynamic = 'force-dynamic'

export default async function EditAtlasPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params
  const { created } = await searchParams
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const u = await db.query.atlasUnits.findFirst({ where: eq(atlasUnits.id, id) })
  if (!u) notFound()
  const parents = await db.select({ id: atlasUnits.id, code: atlasUnits.code, name: atlasUnits.name, level: atlasUnits.level }).from(atlasUnits).orderBy(asc(atlasUnits.code))
  return (
    <>
      <AdminHeader title={`Edit ${u.code}`} />
      {created && <p role="status" className="mb-4 rounded-lg bg-brand/10 px-3.5 py-2.5 text-sm text-brand-muted">Created.</p>}
      <AtlasForm
        parents={parents}
        initial={{
          id: u.id, code: u.code, name: u.name, level: u.level, parentId: u.parentId ?? '',
          summary: u.summary ?? '', demographics: u.demographics ?? '',
          problemDomains: u.problemDomains.join('\n'), resources: u.resources.join('\n'),
          initiatives: u.initiatives ?? '', dataSources: u.dataSources ?? '',
          verified: u.verified, published: u.published, sortOrder: String(u.sortOrder),
        }}
      />
      <div className="mt-6"><DeleteButton action={deleteAtlasUnit.bind(null, u.id)} what={`“${u.name}”`} label="Delete unit" /></div>
    </>
  )
}
