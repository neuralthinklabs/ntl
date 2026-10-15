import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Boxes, CalendarDays, Droplets, FileText, Rocket, Search, Users } from 'lucide-react'
import { IconTile, ProgressBar, SectionHeading, StatusBadge } from '@/components/site/ui'
import { GoalIcon } from '@/components/ntldgs/goal-icon'
import { goals as ntldgs } from '@/lib/ntldgs'
import { money } from '@/lib/format'
import { percentFunded } from '@/lib/goals'
import { btnPrimary } from '@/lib/ui'
import type { StoryCardData } from '@/lib/stories'

export function HomeStats({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <section aria-label="Impact so far" className="border-b border-line bg-white">
      <dl className="mx-auto grid max-w-6xl grid-cols-2 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="px-4 py-9 text-center sm:px-6">
            <dd className="text-gradient text-3xl font-semibold tracking-tight">{s.value}</dd>
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

const cardBase =
  'group flex h-full flex-col rounded-3xl p-7 transition-all hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand'
const light = `${cardBase} border border-line bg-gradient-to-br from-white via-white to-brand-soft shadow-sm hover:shadow-lg hover:shadow-brand/10`
const dark = `${cardBase} bg-ink text-white shadow-xl shadow-ink/20`
const more = 'mt-6 inline-flex items-center gap-1.5 text-sm font-semibold'

export function CurrentFocus({ goal, project, event }: { goal: Goal | null; project: Project | null; event: Ev | null }) {
  if (!goal && !project && !event) return null
  const pct = goal ? percentFunded(goal) : 0

  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionHeading label="What we’re working on" title="Current focus" />

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {goal && (
          <Link href={`/goals/${goal.slug}`} className={light}>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
              <Droplets className="size-4 text-brand-muted" /> Campaign
            </span>
            <h3 className="mt-4 text-xl font-semibold text-ink">{goal.title}</h3>
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
            <span className={`${more} text-brand-muted`}>
              Support this campaign <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        )}

        {project && (
          <Link href="/portfolio" className={dark}>
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-white/70">
                <Boxes className="size-4 text-brand" /> Project
              </span>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-brand ring-1 ring-inset ring-white/15">
                {project.status}
              </span>
            </div>
            <h3 className="mt-4 text-xl font-semibold">{project.name}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-white/65">{project.description}</p>
            <span className={`${more} text-brand`}>
              See all projects <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        )}

        {event && (
          <Link href="/events" className={light}>
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                <CalendarDays className="size-4 text-brand-muted" /> Next event
              </span>
              <StatusBadge tone="active">Upcoming</StatusBadge>
            </div>
            <h3 className="mt-4 text-xl font-semibold text-ink">{event.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{event.meta}</p>
            <span className={`${more} text-brand-muted`}>
              View events <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        )}
      </div>
    </section>
  )
}

// A real sequence, so numbering is meaningful here.
const steps = [
  { icon: FileText, title: 'Submit', text: 'Anyone can describe a real problem with context and evidence.' },
  { icon: Search, title: 'Review', text: 'The team reviews it, usually within 1–2 weeks.' },
  { icon: Users, title: 'Build', text: 'Volunteers, partners and researchers shape a response.' },
  { icon: Rocket, title: 'Show progress', text: 'Updates and funding are public. Only confirmed payments count.' },
]

export function HowItWorks() {
  return (
    <section className="border-y border-line bg-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.6fr]">
        <SectionHeading
          label="Our approach"
          title="From real problems to lasting solutions"
          description="We identify meaningful problems, build with real people, and keep progress open."
        />
        <ol className="grid gap-8 sm:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title}>
              <IconTile icon={s.icon} className="size-14" />
              <p className="mt-4 text-sm font-semibold text-ink">
                {i + 1}. {s.title}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export function NtldgTeaser() {
  return (
    <section className="relative overflow-hidden bg-ink text-white">
      <div aria-hidden="true" className="bg-hero-glow absolute inset-0" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Our north star</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Twelve goals for human flourishing</h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/70">
            Every problem we take on, every campaign we fund and every story we publish connects to one of twelve goals:
            a better life, a stronger society, and a future worth inheriting.
          </p>
          <Link href="/ntldgs" className={`${btnPrimary} mt-8`}>
            Explore the 12 goals <ArrowRight className="size-4" />
          </Link>
        </div>
        <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6" aria-label="The twelve goals">
          {ntldgs.map((g, i) => (
            <li key={g.slug}>
              <Link
                href={`/ntldgs/${g.slug}`}
                className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/[0.06] p-2.5 text-center ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/10"
              >
                <GoalIcon index={i} className="size-9" />
                <span className="text-xs font-medium text-white/80">{g.verb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function FeaturedStory({ story }: { story: StoryCardData | null }) {
  if (!story) return null
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <Link
        href={`/stories/${story.slug}`}
        className="group grid overflow-hidden rounded-3xl border border-line bg-white shadow-sm transition-shadow hover:shadow-lg hover:shadow-brand/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand md:grid-cols-2"
      >
        <div className="relative min-h-56 bg-slate-100">
          {story.image && (
            <Image src={story.image} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          )}
        </div>
        <div className="flex flex-col justify-center p-8 sm:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted">Latest story</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-ink">{story.title}</h3>
          <p className="mt-3 text-base leading-relaxed text-slate-600">{story.excerpt}</p>
          <span className={`${more} text-brand-muted`}>
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
      <div className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-16 text-center sm:px-12">
        <div aria-hidden="true" className="bg-hero-glow absolute inset-0" />
        <div className="relative">
          <h2 className="mx-auto max-w-xl text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Let’s build what’s next
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-white/70">
            Have time, skills or an idea to give? We match volunteers to projects based on skills and availability.
          </p>
          <Link href="/volunteer" className={`${btnPrimary} mt-8`}>
            Become a volunteer <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
