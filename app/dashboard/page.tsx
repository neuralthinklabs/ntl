import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { and, count, desc, eq } from 'drizzle-orm'
import { SiteShell } from '@/components/site/site-shell'
import { Dashboard } from '@/components/dashboard/dashboard'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { profiles, problems, activityRecords, userAchievements, eventRegistrations } from '@/db/schema'

export const metadata: Metadata = { title: 'Dashboard', robots: { index: false } }

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/dashboard')

  const [profile, [problemCount], [attended], [achievementCount], activity] = await Promise.all([
    db.query.profiles.findFirst({ where: eq(profiles.id, user.id) }),
    db.select({ n: count() }).from(problems).where(eq(problems.submittedBy, user.id)),
    db
      .select({ n: count() })
      .from(eventRegistrations)
      .where(and(eq(eventRegistrations.userId, user.id), eq(eventRegistrations.status, 'attended'))),
    db.select({ n: count() }).from(userAchievements).where(eq(userAchievements.userId, user.id)),
    db.query.activityRecords.findMany({
      where: eq(activityRecords.userId, user.id),
      orderBy: [desc(activityRecords.createdAt)],
      limit: 10,
    }),
  ])

  return (
    <SiteShell>
      <div className="bg-slate-50">
        <Dashboard
          name={profile?.fullName || user.email?.split('@')[0] || 'there'}
          points={profile?.points ?? 0}
          problemsSubmitted={problemCount.n}
          eventsAttended={attended.n}
          achievementsCount={achievementCount.n}
          isAdmin={profile?.role === 'admin'}
          activity={activity.map((a) => ({
            id: a.id,
            title: a.title,
            meta: a.meta ?? '',
            date: a.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }),
            type: a.type,
          }))}
        />
      </div>
    </SiteShell>
  )
}
