import { desc, eq } from 'drizzle-orm'
import { SiteShell } from '@/components/site/site-shell'
import { HomeHero } from '@/components/home/hero'
import { CurrentFocus, FeaturedStory, HomeCta, HomeStats, HowItWorks, NtldgTeaser } from '@/components/home/sections'
import { GoalSprite } from '@/components/ntldgs/goal-icon'
import { db } from '@/db'
import { goals, portfolioItems } from '@/db/schema'
import { getHomeStats } from '@/lib/stats'
import { getUpcomingEvents } from '@/lib/events'
import { getLatestStory } from '@/lib/stories'

export default async function HomePage() {
  const [stats, goal, project, events, story] = await Promise.all([
    getHomeStats(),
    db.query.goals.findFirst({ where: eq(goals.status, 'in_progress'), orderBy: [desc(goals.updatedAt)] }),
    db.query.portfolioItems.findFirst({ where: eq(portfolioItems.status, 'In Progress') }),
    getUpcomingEvents(1),
    getLatestStory(),
  ])

  return (
    <SiteShell>
      <GoalSprite />
      <HomeHero />
      <HomeStats stats={stats} />
      <CurrentFocus
        goal={goal ?? null}
        project={project ?? null}
        event={events[0] ? { title: events[0].title, meta: events[0].meta } : null}
      />
      <HowItWorks />
      <NtldgTeaser />
      <FeaturedStory story={story} />
      <HomeCta />
    </SiteShell>
  )
}
