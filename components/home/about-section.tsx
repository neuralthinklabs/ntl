import Image from 'next/image'
import { BookOpen, GitBranch, GraduationCap, Lightbulb, Microscope, Package, ShieldCheck, Users, Wrench } from 'lucide-react'
import { IconTile, SectionHeading, SectionLabel } from '@/components/site/ui'
import { Overlays } from '@/components/brand/graphics'

// Moved here from the old /about page (now merged into the homepage, id="about").
const founder = {
  name: 'Ojas Jhawar',
  title: 'Founder, Neural Think Labs',
  photo: '/images/founder.jpg' as string | null,
  bio: 'Ojas Jhawar is the founder of Neural Think Labs (NTL), driven by a passion for innovation, technology, and solving real-world problems. He aims to bring people together to learn, collaborate, and turn ideas into meaningful solutions that create a positive impact on humanity.',
  motto: 'Work For A Cause',
}

const domains = [
  { icon: GraduationCap, title: 'Education', text: 'Learning for a bigger tomorrow.' },
  { icon: Lightbulb, title: 'Innovation', text: 'Turning ideas into real-world solutions.' },
  { icon: Microscope, title: 'Research', text: 'Evidence for better decisions.' },
  { icon: Package, title: 'Products', text: 'Tools for real impact.' },
  { icon: Wrench, title: 'Services', text: 'Practical support for real needs.' },
  { icon: BookOpen, title: 'Publishing', text: 'Sharing knowledge openly.' },
]

const approach = [
  { icon: Users, title: 'People-first' },
  { icon: ShieldCheck, title: 'Open & transparent' },
  { icon: GitBranch, title: 'Cross-disciplinary' },
  { icon: Lightbulb, title: 'Scalable' },
]

export function AboutSection() {
  return (
    <section id="about" aria-labelledby="about-heading" className="relative mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
      <Overlays className="absolute right-6 top-16 hidden w-44 opacity-80 lg:block" />
      <SectionHeading label="About NTL" title="What we do" description="A global ecosystem for learning, innovation and real-world impact." />
      <h2 id="about-heading" className="sr-only">About Neural Think Labs</h2>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-line bg-white p-8 shadow-sm">
          <SectionLabel>Our mission</SectionLabel>
          <h3 className="mt-2 text-xl font-semibold text-ink">Making impact accessible</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Create accessible ways for people to learn, participate and have impact, connecting public contribution with organized teams that can actually research, build and ship outcomes.
          </p>
        </div>
        <div className="rounded-3xl bg-brand/5 p-8 ring-1 ring-inset ring-brand/15">
          <SectionLabel>Our vision</SectionLabel>
          <h3 className="mt-2 text-xl font-semibold text-ink">A shared engine for good</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Build a scalable ecosystem where people can learn, spin up real problems, contribute their skills, collaborate across disciplines, and help turn ideas into working solutions.
          </p>
        </div>
      </div>

      <div className="mt-12 grid gap-8 rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8 md:grid-cols-[200px_1fr]">
        <div className="relative mx-auto aspect-square w-40 overflow-hidden rounded-2xl bg-slate-100 md:w-full">
          {founder.photo && <Image src={founder.photo} alt={founder.name} fill sizes="200px" className="object-cover" />}
        </div>
        <div>
          <SectionLabel>Our founder</SectionLabel>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-ink">{founder.name}</h3>
          <p className="mt-0.5 text-sm font-medium text-brand-muted">{founder.title}</p>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">{founder.bio}</p>
          <p className="mt-3 text-sm font-semibold text-ink">{founder.motto}</p>
        </div>
      </div>

      <h3 className="mt-14 text-xl font-semibold tracking-tight text-ink">Where we focus</h3>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {domains.map((d) => (
          <div key={d.title} className="rounded-2xl border border-line bg-white p-6 shadow-sm">
            <IconTile icon={d.icon} />
            <h4 className="mt-4 text-base font-semibold text-ink">{d.title}</h4>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{d.text}</p>
          </div>
        ))}
      </div>

      <h3 className="mt-14 text-xl font-semibold tracking-tight text-ink">How we work</h3>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {approach.map((a) => (
          <div key={a.title} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-5 shadow-sm">
            <IconTile icon={a.icon} />
            <span className="text-sm font-semibold text-ink">{a.title}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
