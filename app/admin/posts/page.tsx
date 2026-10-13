import Link from 'next/link'
import { count, desc } from 'drizzle-orm'
import { db } from '@/db'
import { stories } from '@/db/schema'
import { Pager } from '@/components/site/pager'
import { AdminHeader, EmptyState } from '@/components/admin/admin-header'
import { parsePage, totalPages } from '@/lib/pagination'

export const metadata = { title: 'Posts & stories' }

export default async function AdminPostsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page, limit, offset } = parsePage(await searchParams)
  const [rows, [{ value: total }]] = await Promise.all([
    db.query.stories.findMany({ orderBy: [desc(stories.updatedAt)], limit, offset }),
    db.select({ value: count() }).from(stories),
  ])
  const now = new Date()

  return (
    <>
      <AdminHeader
        title="Posts & stories"
        description="Blog posts and stories shown on the Stories page."
        newHref="/admin/posts/new"
        newLabel="New post"
      />
      <div className="flex flex-col gap-3">
        {rows.map((s) => {
          const live = s.publishedAt && s.publishedAt <= now
          return (
            <Link
              key={s.id}
              href={`/admin/posts/${s.id}`}
              className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{s.title}</p>
                <p className="mt-0.5 text-xs text-slate-600">
                  {s.category ?? 'Uncategorised'} · updated {s.updatedAt.toLocaleDateString('en-US', { timeZone: 'UTC' })}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${live ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                {live ? 'Published' : 'Draft'}
              </span>
            </Link>
          )
        })}
        {rows.length === 0 && <EmptyState>No posts yet. Write your first one.</EmptyState>}
      </div>
      <Pager page={page} totalPages={totalPages(total, limit)} basePath="/admin/posts" />
    </>
  )
}
