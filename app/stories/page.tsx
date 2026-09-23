import type { Metadata } from 'next'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { StoriesList } from '@/components/stories/stories-list'

export const metadata: Metadata = {
  title: 'Stories — Neural Think Labs',
  description:
    'Real people. Real progress. Insights, research and stories from our community.',
}

export default function StoriesPage() {
  return (
    <SiteShell>
      <PageHero
        title="Stories & Updates"
        description="Real people. Real progress. Insights, research and stories from our community."
      />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <StoriesList />
      </div>
    </SiteShell>
  )
}
