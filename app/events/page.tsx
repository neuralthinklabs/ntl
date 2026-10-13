import type { Metadata } from 'next'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { EventsContent } from '@/components/events/events-content'
import { getUpcomingEvents, getPastEvents, getMyRegistrations } from '@/lib/events'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Events',
  description: 'Workshops, talks, ventures and more — join us online or in person.',
}

export default async function EventsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [upcoming, past, mine] = await Promise.all([
    getUpcomingEvents(),
    getPastEvents(),
    user ? getMyRegistrations(user.id) : Promise.resolve({} as Record<string, string>),
  ])

  return (
    <SiteShell>
      <PageHero title="Events" description="Workshops, talks, ventures and more — join us online or in person." />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <EventsContent upcoming={upcoming} past={past} isLoggedIn={!!user} registrations={mine} />
      </div>
    </SiteShell>
  )
}
