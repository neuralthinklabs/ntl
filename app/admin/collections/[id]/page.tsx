import { notFound } from 'next/navigation'
import { asc, desc, eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { stories } from '@/db/schema'
import { collections, collectionStories } from '@/db/collections-schema'
import { AdminHeader } from '@/components/admin/admin-header'
import { CollectionForm } from '@/components/admin/collection-form'
import { CollectionStories } from '@/components/admin/collection-stories'
import { DeleteButton } from '@/components/admin/delete-button'
import { deleteCollection } from '@/actions/admin/collections'

export const metadata = { title: 'Edit series or magazine' }
export const dynamic = 'force-dynamic'

export default async function EditCollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ created?: string }>
}) {
  const { id } = await params
  const { created } = await searchParams
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const [c] = await db.select().from(collections).where(eq(collections.id, id)).limit(1)
  if (!c) notFound()

  const now = new Date()
  const [members, available] = await Promise.all([
    db
      .select({ id: stories.id, title: stories.title, publishedAt: stories.publishedAt, position: collectionStories.position, issue: collectionStories.issue })
      .from(collectionStories)
      .innerJoin(stories, eq(collectionStories.storyId, stories.id))
      .where(eq(collectionStories.collectionId, id))
      .orderBy(asc(collectionStories.issue), asc(collectionStories.position)),
    // Stories that are not in any collection yet.
    db
      .select({ id: stories.id, title: stories.title })
      .from(stories)
      .leftJoin(collectionStories, eq(collectionStories.storyId, stories.id))
      .where(isNull(collectionStories.storyId))
      .orderBy(desc(stories.updatedAt))
      .limit(200),
  ])

  return (
    <>
      <AdminHeader title="Edit series or magazine" />
      {created && <p role="status" className="mb-4 rounded-lg bg-brand/10 px-3.5 py-2.5 text-sm text-brand-muted">Created. Add stories below, then tick Published.</p>}
      <div className="flex flex-col gap-6">
        <CollectionForm
          initial={{
            id: c.id,
            title: c.title,
            slug: c.slug,
            kind: c.kind,
            description: c.description ?? '',
            coverImage: c.coverImage ?? '',
            published: !!c.publishedAt && c.publishedAt <= now,
          }}
        />
        <CollectionStories
          collectionId={c.id}
          kind={c.kind}
          members={members.map((m) => ({ id: m.id, title: m.title, position: m.position, issue: m.issue, live: !!m.publishedAt && m.publishedAt <= now }))}
          available={available}
        />
        <div>
          <DeleteButton action={deleteCollection.bind(null, c.id)} what={`“${c.title}” (its stories are kept)`} label="Delete" />
        </div>
      </div>
    </>
  )
}
