import type { Metadata } from 'next'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { ProblemForm } from '@/components/problems/problem-form'
import { createClient } from '@/lib/supabase/server'
import { goalIndexBySlug, goals } from '@/lib/ntldgs'

export const metadata: Metadata = {
  title: 'Submit a problem',
  description: 'Real-world problems need real solutions. Tell us what is happening, and help us turn it into action.',
}

export default async function ProblemsPage({ searchParams }: { searchParams: Promise<{ goal?: string }> }) {
  const { goal } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const gi = goalIndexBySlug(goal)

  return (
    <SiteShell>
      <PageHero title="Submit a problem" description="Real-world problems need real solutions. Tell us what is happening, and help us turn it into action." />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <ProblemForm
          isLoggedIn={!!user}
          ntldgSlug={gi >= 0 ? goals[gi].slug : ''}
          ntldgLabel={gi >= 0 ? `${goals[gi].verb}: ${goals[gi].title}` : ''}
        />
      </div>
    </SiteShell>
  )
}
