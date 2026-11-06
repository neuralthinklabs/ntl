import { asc } from 'drizzle-orm'
import { db } from '@/db'
import { atlasUnits, goals } from '@/db/schema'
import { AdminHeader } from '@/components/admin/admin-header'
import { CommunityForm } from '@/components/admin/community-form'

export const metadata = { title: 'New group' }
export const dynamic = 'force-dynamic'

export default async function NewCommunityPage() {
  const [units, camps] = await Promise.all([
    db.select({ id: atlasUnits.id, code: atlasUnits.code, name: atlasUnits.name }).from(atlasUnits).orderBy(asc(atlasUnits.code)),
    db.select({ id: goals.id, title: goals.title }).from(goals).orderBy(asc(goals.title)),
  ])
  return (
    <>
      <AdminHeader title="New group" />
      <CommunityForm atlasUnits={units.map((u) => ({ id: u.id, label: `${u.code} · ${u.name}` }))} goals={camps.map((g) => ({ id: g.id, label: g.title }))} />
    </>
  )
}
