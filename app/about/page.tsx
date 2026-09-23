import type { Metadata } from 'next'
import {
  BookOpen,
  GitBranch,
  GraduationCap,
  Lightbulb,
  Microscope,
  Package,
  ShieldCheck,
  Users,
  Wrench,
} from 'lucide-react'
import { SiteShell } from '@/components/site/site-shell'
import { PageHero } from '@/components/site/page-hero'
import { IconTile, SectionLabel } from '@/components/site/ui'

export const metadata: Metadata = {
  title: 'About — Neural Think Labs',
  description:
    'A global ecosystem for learning, innovation and real-world impact.',
}

const domains = [
  {
    icon: GraduationCap,
    title: 'Education',
    text: 'Learning for a bigger tomorrow.',
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    text: 'Turning ideas into real-world solutions.',
  },
  {
    icon: Microscope,
    title: 'Research',
    text: 'Evidence for better decisions.',
  },
  {
    icon: Package,
    title: 'Products',
    text: 'Tools for real impact.',
  },
  {
    icon: Wrench,
    title: 'Services',
    text: 'Practical support for real needs.',
  },
  {
    icon: BookOpen,
    title: 'Publishing',
    text: 'Sharing knowledge openly.',
  },
]

const approach = [
  { icon: Users, title: 'People-first' },
  { icon: ShieldCheck, title: 'Open & transparent' },
  { icon: GitBranch, title: 'Cross-disciplinary' },
  { icon: Lightbulb, title: 'Scalable' },
]

export default function AboutPage() {
  return (
    <SiteShell>
      <PageHero
        title="What We Do"
        description="A global ecosystem for learning, innovation and real-world impact."
        image="/images/about-building.png"
      />

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <SectionLabel>Our Mission</SectionLabel>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              Making impact accessible
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Create accessible ways for people to learn, participate and have
              impact — connecting public contribution with organized teams that
              can actually research, build and ship outcomes.
            </p>
          </div>
          <div className="rounded-2xl bg-brand/5 p-8 ring-1 ring-inset ring-brand/15">
            <SectionLabel>Our Vision</SectionLabel>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              A shared engine for good
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Build a scalable ecosystem where people can learn, spin up real
              problems, contribute their skills, collaborate across disciplines,
              and help turn ideas into working solutions.
            </p>
          </div>
        </div>

        <div className="mt-16">
          <SectionLabel>Our Domains</SectionLabel>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
            Where we focus
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {domains.map((d) => (
              <div
                key={d.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <IconTile icon={d.icon} />
                <h3 className="mt-4 text-base font-semibold text-ink">
                  {d.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                  {d.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <SectionLabel>Our Approach</SectionLabel>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
            How we work
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {approach.map((a) => (
              <div
                key={a.title}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <IconTile icon={a.icon} />
                <span className="text-sm font-semibold text-ink">
                  {a.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SiteShell>
  )
}
