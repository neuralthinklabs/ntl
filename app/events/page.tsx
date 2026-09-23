import type { Metadata } from 'next'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { EventsContent } from '@/components/events/events-content'

export const metadata: Metadata = {
  title: 'Events — Neural Think Labs',
  description:
    'Workshops, talks, ventures and more — join us online or in person.',
}

export default function EventsPage() {
  return (
    <SiteShell>
      <PageHero
        title="Events"
        description="Workshops, talks, ventures and more — join us online or in person."
      />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <EventsContent />
      </div>
    </SiteShell>
  )
}
