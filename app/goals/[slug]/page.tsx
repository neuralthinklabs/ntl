import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { SiteShell } from '@/components/site/site-shell'
import { ProgressBar } from '@/components/site/ui'
import { GoalDetail } from '@/components/goals/goal-detail'
import { ContributeForm } from '@/components/goals/contribute-form'
import { getGoalBySlug, percentFunded } from '@/lib/goals'


function money(cents: number) {
  return `$${Math.round(cents / 100).toLocaleString()}`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const goal = await getGoalBySlug(slug)
  return {
    title: goal ? `${goal.title} — Neural Think Labs` : 'Goal — Neural Think Labs',
    description: goal?.problemSummary ?? undefined,
  }
}

export default async function GoalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const goal = await getGoalBySlug(slug)
  if (!goal) notFound()

  const percent = percentFunded(goal)
  const timeline =
    goal.startDate && goal.endDate
      ? `${new Date(goal.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} – ${new Date(goal.endDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}`
      : ''

  return (
    <SiteShell>
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="absolute inset-0">
          <Image src={goal.heroImage || '/images/water-community.png'} alt="" fill className="object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/90 to-ink/60" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1 text-xs font-medium text-brand ring-1 ring-inset ring-brand/25">
            Venture · {goal.status.replace('_', ' ')}
          </span>
          <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{goal.title}</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/70">{goal.problemSummary}</p>

          <div className="mt-8 max-w-xl">
            <div className="mb-2 flex items-end justify-between text-sm">
              <span className="text-2xl font-semibold text-white">{money(goal.fundingRaisedCents)}</span>
              <span className="text-white/60">{percent}% of {money(goal.fundingTargetCents)}</span>
            </div>
            <ProgressBar value={percent} tone="dark" />
            <ContributeForm goalId={goal.id} goalSlug={goal.slug} />
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
            createdAt: new Date(u.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
          }))}
        />
      </div>
    </SiteShell>
  )
}
