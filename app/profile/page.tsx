import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { ProfileForm } from '@/components/profile/profile-form'

export const metadata: Metadata = {
  title: 'Profile — Neural Think Labs',
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/profile')

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.id),
  })

  return (
    <SiteShell>
      <PageHero title="Your Profile" description="Update how you appear to the team and community." />
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <ProfileForm
          email={user.email ?? ''}
          fullName={profile?.fullName ?? ''}
          bio={profile?.bio ?? ''}
        />
      </div>
    </SiteShell>
  )
}
