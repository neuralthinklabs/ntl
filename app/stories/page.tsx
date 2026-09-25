import type { Metadata } from 'next'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { StoriesList } from '@/components/stories/stories-list'
import { getPublishedStories, getStoryCategories } from '@/lib/stories'

export const metadata: Metadata = {
  title: 'Stories — Neural Think Labs',
  description:
    'Real people. Real progress. Insights, research and stories from our community.',
}

export default async function StoriesPage() {
  // P2 #15: real data from the `stories` table instead of lib/data.ts.
  const items = await getPublishedStories()
  const categories = getStoryCategories(items)

  return (
    <SiteShell>
      <PageHero
        title="Stories & Updates"
        description="Real people. Real progress. Insights, research and stories from our community."
      />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <StoriesList items={items} categories={categories} />
      </div>
    </SiteShell>
  )
}
