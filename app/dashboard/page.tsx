import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { and, asc, count, desc, eq, inArray } from 'drizzle-orm'
import { SiteShell } from '@/components/site/site-shell'
import { Dashboard } from '@/components/dashboard/dashboard'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { profiles, problems, activityRecords, achievements, userAchievements, eventRegistrations, assignments } from '@/db/schema'
import { isTeamRole } from '@/lib/roles'

export const metadata: Metadata = { title: 'Dashboard', robots: { index: false } }

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/dashboard')

  const [profile, [problemCount], [attended], allAchievements, mineAchievements, activity, [open]] = await Promise.all([
    db.query.profiles.findFirst({ where: eq(profiles.id, user.id) }),
    db.select({ n: count() }).from(problems).where(eq(problems.submittedBy, user.id)),
    db
      .select({ n: count() })
      .from(eventRegistrations)
      .where(and(eq(eventRegistrations.userId, user.id), eq(eventRegistrations.status, 'attended'))),
    db.select().from(achievements).orderBy(asc(achievements.pointsAwarded), asc(achievements.title)),
    db.select({ id: userAchievements.achievementId }).from(userAchievements).where(eq(userAchievements.userId, user.id)),
    db.query.activityRecords.findMany({
      where: eq(activityRecords.userId, user.id),
      orderBy: [desc(activityRecords.createdAt)],
      limit: 10,
    }),
    db
      .select({ n: count() })
      .from(assignments)
      .where(and(eq(assignments.assigneeId, user.id), inArray(assignments.status, ['assigned', 'in_progress']))),
  ])

  const earned = new Set(mineAchievements.map((m) => m.id))

  return (
    <SiteShell>
      <div className="bg-slate-50">
        <Dashboard
          name={profile?.fullName || user.email?.split('@')[0] || 'there'}
          points={profile?.points ?? 0}
          problemsSubmitted={problemCount.n}
          eventsAttended={attended.n}
          achievements={allAchievements.map((a) => ({
            slug: a.slug,
            title: a.title,
            description: a.description ?? '',
            earned: earned.has(a.id),
          }))}
          isAdmin={profile?.role === 'admin'}
          role={profile?.role ?? 'member'}
          ntlId={profile?.ntlId ?? ''}
          isTeam={isTeamRole(profile?.role)}
          openAssignments={open?.n ?? 0}
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
