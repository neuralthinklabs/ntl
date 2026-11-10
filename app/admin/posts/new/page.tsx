import { desc } from 'drizzle-orm'
import { db } from '@/db'
import { collections } from '@/db/collections-schema'
import { AdminHeader } from '@/components/admin/admin-header'
import { PostForm } from '@/components/admin/post-form'

export const metadata = { title: 'New post' }
export const dynamic = 'force-dynamic'

export default async function NewPostPage() {
  const cols = await db.select({ id: collections.id, title: collections.title, kind: collections.kind }).from(collections).orderBy(desc(collections.updatedAt))
  return (
    <>
      <AdminHeader title="New post" />
      <PostForm collections={cols} />
    </>
  )
}
