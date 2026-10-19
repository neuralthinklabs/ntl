import { asc } from 'drizzle-orm'
import { db } from '@/db'
import { atlasUnits } from '@/db/schema'
import { AdminHeader } from '@/components/admin/admin-header'
import { AtlasForm } from '@/components/admin/atlas-form'

export const metadata = { title: 'New Atlas unit' }
export const dynamic = 'force-dynamic'

export default async function NewAtlasPage() {
  const parents = await db.select({ id: atlasUnits.id, code: atlasUnits.code, name: atlasUnits.name, level: atlasUnits.level }).from(atlasUnits).orderBy(asc(atlasUnits.code))
  return (
    <>
      <AdminHeader title="New Atlas unit" />
      <AtlasForm parents={parents} />
    </>
  )
}
