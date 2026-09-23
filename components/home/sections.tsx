import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CalendarDays, Droplets, GraduationCap } from 'lucide-react'
import { stats } from '@/lib/data'
import { ProgressBar, SectionLabel, StatusBadge } from '@/components/site/ui'

export function HomeStats() {
  return (
    <section className="relative z-10 mx-auto -mt-12 max-w-6xl px-4 sm:px-6">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-slate-200 shadow-xl shadow-slate-900/5 ring-1 ring-slate-200 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white p-6 text-center">
            <div className="text-3xl font-semibold tracking-tight text-ink">
              {s.value}
            </div>
            <div className="mt-1 text-xs font-medium text-slate-500">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function CurrentFocus() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="flex items-end justify-between">
        <div>
          <SectionLabel>What we&apos;re working on</SectionLabel>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Current Focus
          </h2>
        </div>
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-muted hover:text-brand"
        >
          View all <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              <Droplets className="size-3.5 text-brand" /> Goal
            </span>
            <StatusBadge tone="progress">In Progress</StatusBadge>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-ink">
            Clean Water for Rural Communities
          </h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">
            Improving access to clean, safe water in underserved regions.
          </p>
          <div className="mt-4">
            <div className="mb-1.5 flex justify-between text-xs font-medium text-slate-500">
              <span className="text-ink">$31,000 raised</span>
              <span>62% of $50,000</span>
            </div>
            <ProgressBar value={62} />
          </div>
          <Link
            href="/goals/clean-water"
            className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-brand-muted hover:text-brand"
          >
            Support this goal <ArrowRight className="size-4" />
          </Link>
        </article>

        <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              <GraduationCap className="size-3.5 text-brand" /> Project
            </span>
            <StatusBadge tone="progress">In Progress</StatusBadge>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-ink">
            AI for Accessible Education
          </h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">
            Building tools to make quality education more inclusive and
            available to everyone.
          </p>
          <Link
            href="/portfolio"
            className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-brand-muted hover:text-brand"
          >
            Learn more <ArrowRight className="size-4" />
          </Link>
        </article>

        <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              <CalendarDays className="size-3.5 text-brand" /> Event
            </span>
            <StatusBadge tone="active">Upcoming</StatusBadge>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-ink">
            Global Innovation Summit
          </h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">
            Apr 24–26, 2025 · Online. Join changemakers from around the world.
          </p>
          <Link
            href="/events"
            className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-brand-muted hover:text-brand"
          >
            View event <ArrowRight className="size-4" />
          </Link>
        </article>
      </div>
    </section>
  )
}

export function FeaturedStory() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
      <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-2">
        <div className="relative min-h-56">
          <Image
            src="/images/story-community.png"
            alt="Community members collaborating outdoors"
            fill
            className="object-cover"
          />
        </div>
        <div className="flex flex-col justify-center p-8 sm:p-10">
          <SectionLabel>Featured Story</SectionLabel>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
            How Community Input Turned Into a Real Project
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">
            From a local problem submission to a funded initiative — here is how
            an idea from the community became real-world impact.
          </p>
          <Link
            href="/stories"
            className="mt-6 inline-flex w-fit items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink/90"
          >
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
        <h2 className="text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Have a problem? Want to help? Ready to make an impact?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/60">
          Join our community, submit a problem, support a goal, or volunteer
          your skills.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/problems"
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90"
          >
            Get started <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Contact us
          </Link>
        </div>
      </div>
    </section>
  )
}
