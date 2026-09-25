import type { Metadata } from 'next'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { EventsContent } from '@/components/events/events-content'
import { getUpcomingEvents, getPastEvents } from '@/lib/events'

export const metadata: Metadata = {
  title: 'Events — Neural Think Labs',
  description:
    'Workshops, talks, ventures and more — join us online or in person.',
}

export default async function EventsPage() {
  // P2 #15: real data from the `events` table instead of lib/data.ts.
  const [upcoming, past] = await Promise.all([getUpcomingEvents(), getPastEvents()])

  return (
    <SiteShell>
      <PageHero
        title="Events"
        description="Workshops, talks, ventures and more — join us online or in person."
      />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <EventsContent upcoming={upcoming} past={past} />
      </div>
    </SiteShell>
  )
}
