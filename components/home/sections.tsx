import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CalendarDays, Boxes, Droplets } from 'lucide-react'
import { ProgressBar, SectionLabel, StatusBadge } from '@/components/site/ui'
import { GoalIcon } from '@/components/ntldgs/goal-icon'
import { goals as ntldgs } from '@/lib/ntldgs'
import { money } from '@/lib/format'
import { percentFunded } from '@/lib/goals'
import type { StoryCardData } from '@/lib/stories'

export function HomeStats({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <section aria-label="Impact so far" className="relative z-10 mx-auto -mt-12 max-w-6xl px-4 sm:px-6">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-slate-200 shadow-xl shadow-slate-900/5 ring-1 ring-slate-200 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white p-6 text-center">
            <dd className="text-3xl font-semibold tracking-tight text-ink">{s.value}</dd>
            <dt className="mt-1 text-xs font-medium text-slate-600">{s.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  )
}

type Goal = { slug: string; title: string; problemSummary: string | null; fundingRaisedCents: number; fundingTargetCents: number }
type Project = { name: string; description: string; status: string }
type Ev = { title: string; meta: string }

export function CurrentFocus({ goal, project, event }: { goal: Goal | null; project: Project | null; event: Ev | null }) {
  if (!goal && !project && !event) return null
  const pct = goal ? percentFunded(goal) : 0
  const card = 'flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'
  const chip = 'inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700'

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="flex items-end justify-between">
        <div>
          <SectionLabel>What we&apos;re working on</SectionLabel>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Current focus</h2>
        </div>
        <Link href="/portfolio" className="inline-flex items-center gap-1 text-sm font-medium text-brand-muted hover:underline">
          View all <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {goal && (
          <article className={card}>
            <span className={chip}><Droplets className="size-3.5 text-brand-muted" /> Campaign</span>
            <h3 className="mt-4 text-lg font-semibold text-ink">{goal.title}</h3>
            <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">{goal.problemSummary}</p>
            {goal.fundingTargetCents > 0 && (
              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-xs font-medium text-slate-600">
                  <span className="text-ink">{money(goal.fundingRaisedCents)} raised</span>
                  <span>{pct}% of {money(goal.fundingTargetCents)}</span>
                </div>
                <ProgressBar value={pct} label={`${goal.title} funding progress`} />
              </div>
            )}
            <Link href={`/goals/${goal.slug}`} className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-brand-muted hover:underline">
              Support this campaign <ArrowRight className="size-4" />
            </Link>
          </article>
        )}
        {project && (
          <article className={card}>
            <div className="flex items-center justify-between">
              <span className={chip}><Boxes className="size-3.5 text-brand-muted" /> Project</span>
              <StatusBadge tone="progress">{project.status}</StatusBadge>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-ink">{project.name}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{project.description}</p>
            <Link href="/portfolio" className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-brand-muted hover:underline">
              Learn more <ArrowRight className="size-4" />
            </Link>
          </article>
        )}
        {event && (
          <article className={card}>
            <div className="flex items-center justify-between">
              <span className={chip}><CalendarDays className="size-3.5 text-brand-muted" /> Next event</span>
              <StatusBadge tone="active">Upcoming</StatusBadge>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-ink">{event.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{event.meta}</p>
            <Link href="/events" className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-brand-muted hover:underline">
              View event <ArrowRight className="size-4" />
            </Link>
          </article>
        )}
      </div>
    </section>
  )
}

export function NtldgTeaser() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <div className="grid items-center gap-8 md:grid-cols-[1.1fr_1fr]">
          <div>
            <SectionLabel>Our north star</SectionLabel>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Twelve goals for human flourishing</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Every problem we take on, every campaign we fund and every story we publish connects to one of twelve goals: a better life, a stronger society, and a future worth inheriting.
            </p>
            <Link href="/ntldgs" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90">
              Explore the 12 goals <ArrowRight className="size-4" />
            </Link>
          </div>
          <ul className="grid grid-cols-4 gap-3 sm:grid-cols-6" aria-label="The twelve goals">
            {ntldgs.map((g, i) => (
              <li key={g.slug}>
                <Link href={`/ntldgs/${g.slug}`} className="flex flex-col items-center gap-1 rounded-xl p-2 text-center transition-colors hover:bg-slate-50">
                  <GoalIcon index={i} className="size-10" />
                  <span className="text-[11px] font-medium text-slate-700">{g.verb}</span>
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
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
      <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-2">
        <div className="relative min-h-56 bg-slate-100">
          {story.image && <Image src={story.image} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />}
        </div>
        <div className="flex flex-col justify-center p-8 sm:p-10">
          <SectionLabel>Latest story</SectionLabel>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-ink">{story.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{story.excerpt}</p>
          <Link href={`/stories/${story.slug}`} className="mt-6 inline-flex w-fit items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90">
            Read the story <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export function HomeCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
      <div className="rounded-2xl bg-ink px-6 py-12 text-center sm:px-10">
        <h2 className="text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">Have a problem? Want to help?</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/70">
          Submit a problem, support a campaign, or volunteer your skills.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/problems" className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90">
            Submit a problem <ArrowRight className="size-4" />
          </Link>
          <Link href="/contact" className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10">
            Contact us
          </Link>
        </div>
      </div>
    </section>
  )
}
