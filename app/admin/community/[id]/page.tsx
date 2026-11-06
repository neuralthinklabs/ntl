import Link from 'next/link'
import { notFound } from 'next/navigation'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { atlasUnits, goals } from '@/db/schema'
import { communities } from '@/db/community-schema'
import { AdminHeader } from '@/components/admin/admin-header'
import { CommunityForm } from '@/components/admin/community-form'
import { ActionButton } from '@/components/community/action-button'
import { setCommunityArchived } from '@/actions/admin/community'
import { groupHref } from '@/lib/community/constants'

export const metadata = { title: 'Edit group' }
export const dynamic = 'force-dynamic'

export default async function EditCommunityPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params
  const { created } = await searchParams
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const [c] = await db.select().from(communities).where(eq(communities.id, id)).limit(1)
  if (!c) notFound()
  const [units, camps] = await Promise.all([
    db.select({ id: atlasUnits.id, code: atlasUnits.code, name: atlasUnits.name }).from(atlasUnits).orderBy(asc(atlasUnits.code)),
    db.select({ id: goals.id, title: goals.title }).from(goals).orderBy(asc(goals.title)),
  ])
  return (
    <>
      <AdminHeader title={`Edit ${c.name}`} description="Add members, assign leaders and moderators, and review content from the group's own page." />
      {created && <p role="status" className="mb-4 rounded-lg bg-brand/10 px-3.5 py-2.5 text-sm text-brand-muted">Group created. Open it to invite members.</p>}
      <p className="mb-5 flex flex-wrap gap-4 text-sm font-medium">
        <Link href={groupHref(c)} className="text-brand-muted underline">Open the group</Link>
        <Link href={`${groupHref(c)}?tab=members`} className="text-brand-muted underline">Manage members</Link>
        <Link href={`${groupHref(c)}?tab=moderation`} className="text-brand-muted underline">Moderation queue</Link>
      </p>
      <CommunityForm
        atlasUnits={units.map((u) => ({ id: u.id, label: `${u.code} · ${u.name}` }))}
        goals={camps.map((g) => ({ id: g.id, label: g.title }))}
        initial={{ id: c.id, name: c.name, slug: c.slug, description: c.description ?? '', kind: c.kind, visibility: c.visibility, atlasScope: c.atlasScope ?? '', atlasUnitId: c.atlasUnitId ?? '', goalId: c.goalId ?? '', requirePostApproval: c.requirePostApproval }}
      />
      <div className="mt-6">
        <ActionButton action={setCommunityArchived.bind(null, c.id, !c.archivedAt)} label={c.archivedAt ? 'Restore group' : 'Archive group'} confirm={c.archivedAt ? 'Restore this group?' : 'Archive this group? It becomes read-only and leaves Discover.'} variant="danger" />
      </div>
    </>
  )
}
