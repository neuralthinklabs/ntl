import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { SiteShell } from '@/components/site/site-shell'
import { ProgressBar } from '@/components/site/ui'
import { GoalDetail } from '@/components/goals/goal-detail'
import { ContributeForm } from '@/components/goals/contribute-form'
import { getGoalBySlug, percentFunded } from '@/lib/goals'
import { money } from '@/lib/format'
import { goalIndexBySlug, goals as ntldgs } from '@/lib/ntldgs'
import { createClient } from '@/lib/supabase/server'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const goal = await getGoalBySlug(slug)
  return {
    title: goal ? goal.title : 'Campaign',
    description: goal?.problemSummary ?? undefined,
    alternates: { canonical: `/goals/${slug}` },
  }
}

export default async function GoalPage({ params }: Props) {
  const { slug } = await params
  const goal = await getGoalBySlug(slug)
  if (!goal) notFound()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const percent = percentFunded(goal)
  const fmt = (d: Date) => new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
  const timeline = goal.startDate && goal.endDate ? `${fmt(goal.startDate)} – ${fmt(goal.endDate)}` : ''
  const gi = goalIndexBySlug(goal.ntldgSlug)

  return (
    <SiteShell>
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="absolute inset-0">
          <Image src={goal.heroImage || '/images/water-community.png'} alt="" fill sizes="100vw" className="object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/90 to-ink/60" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <span className="inline-flex items-center rounded-full bg-brand/15 px-3 py-1 text-xs font-medium capitalize text-brand ring-1 ring-inset ring-brand/25">
            Campaign · {goal.status.replace('_', ' ')}
          </span>
          <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{goal.title}</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/75">{goal.problemSummary}</p>
          {gi >= 0 && (
            <p className="mt-3 text-sm text-white/75">
              Part of the goal{' '}
              <Link href={`/ntldgs/${ntldgs[gi].slug}`} className="font-semibold text-white underline">
                {ntldgs[gi].verb}: {ntldgs[gi].title}
              </Link>
            </p>
          )}

          <div className="mt-8 max-w-xl">
            <div className="mb-2 flex items-end justify-between text-sm">
              <span className="text-2xl font-semibold text-white">{money(goal.fundingRaisedCents)}</span>
              <span className="text-white/70">{percent}% of {money(goal.fundingTargetCents)}</span>
            </div>
            <ProgressBar value={percent} tone="dark" label="Confirmed funding progress" />
            <p className="mt-2 text-xs text-white/60">Counts confirmed payments only.</p>
            <ContributeForm goalId={goal.id} isLoggedIn={!!user} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <GoalDetail
          problemSummary={goal.problemSummary ?? ''}
          objective={goal.objective ?? ''}
          responsibleTeam={goal.responsibleTeam ?? ''}
          timeline={timeline}
          fundingTarget={money(goal.fundingTargetCents)}
          milestones={goal.milestones}
          updates={goal.updates.map((u) => ({
            id: u.id,
            title: u.title,
            body: u.body,
            createdAt: new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }),
          }))}
        />
      </div>
    </SiteShell>
  )
}
