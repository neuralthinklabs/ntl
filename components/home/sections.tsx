import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CalendarDays, Boxes, Droplets } from 'lucide-react'
import { ProgressBar, SectionHeading, StatusBadge } from '@/components/site/ui'
import { GoalIcon } from '@/components/ntldgs/goal-icon'
import { goals as ntldgs } from '@/lib/ntldgs'
import { money } from '@/lib/format'
import { percentFunded } from '@/lib/goals'
import { btnDark, btnPrimary } from '@/lib/ui'
import type { StoryCardData } from '@/lib/stories'

export function HomeStats({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <section aria-label="Impact so far" className="border-b border-line bg-white">
      <dl className="mx-auto grid max-w-6xl grid-cols-2 divide-line sm:grid-cols-4 sm:divide-x">
        {stats.map((s) => (
          <div key={s.label} className="px-4 py-8 text-center sm:px-6">
            <dd className="text-3xl font-semibold tracking-tight text-ink">{s.value}</dd>
            <dt className="mt-1 text-sm text-slate-600">{s.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  )
}

type Goal = { slug: string; title: string; problemSummary: string | null; fundingRaisedCents: number; fundingTargetCents: number }
type Project = { name: string; description: string; status: string }
type Ev = { title: string; meta: string }

// Each card is one link to its own page, so no destination is offered twice.
const card =
  'group flex h-full flex-col rounded-2xl border border-line bg-white p-6 transition-colors hover:border-brand/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'
const chip = 'inline-flex items-center gap-1.5 text-sm font-medium text-slate-600'
const more = 'mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-muted'

export function CurrentFocus({ goal, project, event }: { goal: Goal | null; project: Project | null; event: Ev | null }) {
  if (!goal && !project && !event) return null
  const pct = goal ? percentFunded(goal) : 0

  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionHeading label="What we’re working on" title="Current focus" />

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {goal && (
          <Link href={`/goals/${goal.slug}`} className={card}>
            <span className={chip}>
              <Droplets className="size-4 text-brand-muted" /> Campaign
            </span>
            <h3 className="mt-4 text-lg font-semibold text-ink">{goal.title}</h3>
            <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">{goal.problemSummary}</p>
            {goal.fundingTargetCents > 0 && (
              <div className="mt-5">
                <div className="mb-2 flex justify-between text-xs font-medium text-slate-600">
                  <span className="text-ink">{money(goal.fundingRaisedCents)} raised</span>
                  <span>
                    {pct}% of {money(goal.fundingTargetCents)}
                  </span>
                </div>
                <ProgressBar value={pct} label={`${goal.title} funding progress`} />
              </div>
            )}
            <span className={more}>
              Support this campaign <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        )}

        {project && (
          <Link href="/portfolio" className={card}>
            <div className="flex items-center justify-between gap-3">
              <span className={chip}>
                <Boxes className="size-4 text-brand-muted" /> Project
              </span>
              <StatusBadge tone="progress">{project.status}</StatusBadge>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-ink">{project.name}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{project.description}</p>
            <span className={more}>
              See all projects <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        )}

        {event && (
          <Link href="/events" className={card}>
            <div className="flex items-center justify-between gap-3">
              <span className={chip}>
                <CalendarDays className="size-4 text-brand-muted" /> Next event
              </span>
              <StatusBadge tone="active">Upcoming</StatusBadge>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-ink">{event.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{event.meta}</p>
            <span className={more}>
              View events <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        )}
      </div>
    </section>
  )
}

export function NtldgTeaser() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <div className="rounded-3xl border border-line bg-white p-8 sm:p-12">
        <div className="grid items-center gap-10 md:grid-cols-[1.1fr_1fr]">
          <div>
            <SectionHeading
              label="Our north star"
              title="Twelve goals for human flourishing"
              description="Every problem we take on, every campaign we fund and every story we publish connects to one of twelve goals: a better life, a stronger society, and a future worth inheriting."
            />
            <Link href="/ntldgs" className={`${btnDark} mt-8`}>
              Explore the 12 goals <ArrowRight className="size-4" />
            </Link>
          </div>
          <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6" aria-label="The twelve goals">
            {ntldgs.map((g, i) => (
              <li key={g.slug}>
                <Link
                  href={`/ntldgs/${g.slug}`}
                  className="flex flex-col items-center gap-1.5 rounded-xl p-2 text-center transition-colors hover:bg-canvas"
                >
                  <GoalIcon index={i} className="size-10" />
                  <span className="text-xs font-medium text-slate-700">{g.verb}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export function FeaturedStory({ story }: { story: StoryCardData | null }) {
  if (!story) return null
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <Link
        href={`/stories/${story.slug}`}
        className="group grid overflow-hidden rounded-2xl border border-line bg-white transition-colors hover:border-brand/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:grid-cols-2"
      >
        <div className="relative min-h-56 bg-slate-100">
          {story.image && (
            <Image src={story.image} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          )}
        </div>
        <div className="flex flex-col justify-center p-8 sm:p-12">
          <p className="text-sm font-semibold text-brand-muted">Latest story</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-ink">{story.title}</h3>
          <p className="mt-3 text-base leading-relaxed text-slate-600">{story.excerpt}</p>
          <span className={more}>
            Read the story <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </section>
  )
}

export function HomeCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <div className="rounded-3xl bg-ink px-6 py-14 text-center sm:px-12">
        <h2 className="mx-auto max-w-xl text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Have time, skills or an idea to give?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-white/70">
          We match volunteers to projects based on skills and availability.
        </p>
        <Link href="/volunteer" className={`${btnPrimary} mt-8`}>
          Become a volunteer <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  )
}
