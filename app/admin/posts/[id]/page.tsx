import Link from 'next/link'
import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { stories } from '@/db/schema'
import { AdminHeader } from '@/components/admin/admin-header'
import { PostForm } from '@/components/admin/post-form'
import { DeleteButton } from '@/components/admin/delete-button'
import { deletePost } from '@/actions/admin/posts'

export const metadata = { title: 'Edit post' }

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ created?: string }>
}) {
  const { id } = await params
  const { created } = await searchParams
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const post = await db.query.stories.findFirst({ where: eq(stories.id, id) })
  if (!post) notFound()
  const live = !!post.publishedAt && post.publishedAt <= new Date()

  return (
    <>
      <AdminHeader title="Edit post" description={live ? 'This post is live.' : 'This post is a draft and is not public.'} />
      {created && <p role="status" className="mb-4 rounded-lg bg-brand/10 px-3.5 py-2.5 text-sm text-brand-muted">Post created.</p>}
      {live && (
        <p className="mb-4 text-sm">
          <Link href={`/stories/${post.slug}`} className="font-medium text-brand-muted underline" target="_blank">
            View on the site
          </Link>
        </p>
      )}
      <PostForm
        initial={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          category: post.category ?? 'Blog',
          excerpt: post.excerpt ?? '',
          body: post.body ?? '',
          coverImage: post.coverImage ?? '',
          ntldgSlug: post.ntldgSlug ?? '',
          published: live,
        }}
      />
      <div className="mt-6">
        <DeleteButton action={deletePost.bind(null, post.id)} what={`“${post.title}”`} label="Delete post" />
      </div>
    </>
  )
}
