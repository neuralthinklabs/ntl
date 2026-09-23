import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { desc, eq } from 'drizzle-orm'
import { SiteShell } from '@/components/site/site-shell'
import { Dashboard } from '@/components/dashboard/dashboard'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { profiles, problems, activityRecords, userAchievements, eventRegistrations } from '@/db/schema'

export const metadata: Metadata = {
  title: 'Dashboard — Neural Think Labs',
  description: 'Your activity at a glance.',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?next=/dashboard')

  const [profile, myProblems, myActivity, myAchievements, myRegistrations] =
    await Promise.all([
      db.query.profiles.findFirst({ where: eq(profiles.id, user.id) }),
      db.query.problems.findMany({
        where: eq(problems.submittedBy, user.id),
      }),
      db.query.activityRecords.findMany({
        where: eq(activityRecords.userId, user.id),
        orderBy: [desc(activityRecords.createdAt)],
        limit: 10,
      }),
      db.query.userAchievements.findMany({
        where: eq(userAchievements.userId, user.id),
      }),
      db.query.eventRegistrations.findMany({
        where: eq(eventRegistrations.userId, user.id),
      }),
    ])

  return (
    <SiteShell>
      <div className="bg-slate-50">
        <Dashboard
          name={profile?.fullName || user.email?.split('@')[0] || 'there'}
          points={profile?.points ?? 0}
          problemsSubmitted={myProblems.length}
          eventsAttended={
            myRegistrations.filter((r) => r.status === 'attended').length
          }
          achievementsCount={myAchievements.length}
          activity={myActivity.map((a) => ({
            id: a.id,
            title: a.title,
            meta: a.meta ?? '',
            date: new Date(a.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
            type: a.type,
          }))}
        />
      </div>
    </SiteShell>
  )
}
