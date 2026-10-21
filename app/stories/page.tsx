import type { Metadata } from 'next'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { Pager } from '@/components/site/pager'
import { StoriesList } from '@/components/stories/stories-list'
import { STORIES_PAGE_SIZE, getStoriesPage, getStoryCategoryList } from '@/lib/stories'
import { parsePage, totalPages } from '@/lib/pagination'

export const metadata: Metadata = {
  title: 'Stories & updates',
  description: 'Real people. Real progress. Insights, research and stories from our community.',
}
export const dynamic = 'force-dynamic'

export default async function StoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string }>
}) {
  const sp = await searchParams
  const categories = await getStoryCategoryList()
  const category = sp.category && categories.includes(sp.category) ? sp.category : 'All'
  const { page } = parsePage(sp)
  const { items, total } = await getStoriesPage({ page, category })
  const basePath = category === 'All' ? '/stories' : `/stories?category=${encodeURIComponent(category)}`

  return (
    <SiteShell>
      <PageHero title="Stories & Updates" description="Real people. Real progress. Insights, research and stories from our community." />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <StoriesList items={items} categories={categories} active={category} />
        <Pager page={page} totalPages={totalPages(total, STORIES_PAGE_SIZE)} basePath={basePath} />
      </div>
    </SiteShell>
  )
}
